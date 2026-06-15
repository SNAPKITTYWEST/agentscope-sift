/**
 * AGENTSCOPE-SIFT — MCP Server
 *
 * "SIFT gives investigators tools. AGENTSCOPE gives the AI an evidence trail."
 *
 * Every tool call passes through:
 *   BOB Plasma Filter → SENTINEL → SealForge WORM chain
 *
 * The agent physically cannot:
 *   - Run destructive commands (no write tools exposed)
 *   - Skip evidence validation (BOB gates every result)
 *   - Produce an unproven finding (every finding sealed to a tool call)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { bob } from './pipeline/bob.js';
import { sentinel } from './pipeline/sentinel.js';
import { sealEntry, initChain } from './pipeline/seal.js';
import * as SIFT from './tools/sift.js';
initChain();
const server = new Server({ name: 'agentscope-sift', version: '1.0.0' }, { capabilities: { tools: {} } });
// ── Tool registry ─────────────────────────────────────────────────────────────
const TOOLS = [
    {
        name: 'list_processes',
        description: 'List running processes from a memory image (volatility3 windows.pslist)',
        inputSchema: { type: 'object', properties: { memory_image: { type: 'string', description: 'Path to memory dump (.raw, .mem, .dmp)' } }, required: ['memory_image'] },
    },
    {
        name: 'scan_network_connections',
        description: 'Extract network connections from memory (volatility3 windows.netstat)',
        inputSchema: { type: 'object', properties: { memory_image: { type: 'string' } }, required: ['memory_image'] },
    },
    {
        name: 'dump_cmdline',
        description: 'Extract command-line arguments of all processes from memory',
        inputSchema: { type: 'object', properties: { memory_image: { type: 'string' } }, required: ['memory_image'] },
    },
    {
        name: 'find_injected_code',
        description: 'Detect code injection and suspicious memory regions (volatility3 malfind)',
        inputSchema: { type: 'object', properties: { memory_image: { type: 'string' } }, required: ['memory_image'] },
    },
    {
        name: 'get_registry_hives',
        description: 'List Windows registry hives found in memory',
        inputSchema: { type: 'object', properties: { memory_image: { type: 'string' } }, required: ['memory_image'] },
    },
    {
        name: 'list_disk_partitions',
        description: 'List partitions in a disk image (mmls)',
        inputSchema: { type: 'object', properties: { image_path: { type: 'string' } }, required: ['image_path'] },
    },
    {
        name: 'list_files',
        description: 'List files on a disk image filesystem including deleted files (fls)',
        inputSchema: { type: 'object', properties: { image_path: { type: 'string' }, offset: { type: 'number' } }, required: ['image_path'] },
    },
    {
        name: 'get_filesystem_info',
        description: 'Get filesystem metadata from disk image (fsstat)',
        inputSchema: { type: 'object', properties: { image_path: { type: 'string' }, offset: { type: 'number' } }, required: ['image_path'] },
    },
    {
        name: 'scan_with_yara',
        description: 'Scan a file or directory with YARA malware rules',
        inputSchema: { type: 'object', properties: { rules_file: { type: 'string' }, target_path: { type: 'string' } }, required: ['rules_file', 'target_path'] },
    },
    {
        name: 'extract_strings',
        description: 'Extract printable strings from a binary — finds IOCs, URLs, registry keys',
        inputSchema: { type: 'object', properties: { file_path: { type: 'string' }, min_length: { type: 'number' } }, required: ['file_path'] },
    },
    {
        name: 'hash_file',
        description: 'Compute SHA-256 and MD5 hashes of a file for evidence integrity',
        inputSchema: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] },
    },
    {
        name: 'get_file_metadata',
        description: 'Extract file type and metadata (exiftool)',
        inputSchema: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] },
    },
    {
        name: 'analyze_pcap',
        description: 'Analyze a network capture — DNS queries, HTTP requests (tshark)',
        inputSchema: { type: 'object', properties: { pcap_file: { type: 'string' } }, required: ['pcap_file'] },
    },
    {
        name: 'verify_chain',
        description: 'Verify the WORM evidence chain has not been tampered with',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
];
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
// ── Tool dispatcher ───────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const a = (args ?? {});
    // Seal the call intent before executing
    sealEntry('TOOL_CALL', { tool: name, args: a }, name);
    let rawResult;
    try {
        rawResult = await dispatch(name, a);
    }
    catch (err) {
        sealEntry('BLOCK', { tool: name, reason: err.message }, name);
        return { content: [{ type: 'text', text: `[BLOCKED] ${err.message}` }], isError: true };
    }
    const rawStr = JSON.stringify(rawResult);
    // BOB Plasma Filter — catches adversarial tool output
    const bobResult = bob(rawStr);
    if (!bobResult.pass) {
        sealEntry('BLOCK', {
            tool: name,
            blocked_at: bobResult.blocked_at,
            violation: bobResult.plasma.violation ?? bobResult.coherence.message,
        }, name);
        return {
            content: [{ type: 'text', text: `[BOB BLOCKED at ${bobResult.blocked_at}] Tool output failed integrity check. Finding discarded.` }],
            isError: true,
        };
    }
    // SENTINEL zero-trust gate
    const sentinelResult = sentinel(name, rawStr);
    if (sentinelResult.verdict !== 'APPROVED') {
        sealEntry('BLOCK', {
            tool: name,
            verdict: sentinelResult.verdict,
            finding: sentinelResult.finding,
        }, name);
        return {
            content: [{ type: 'text', text: `[SENTINEL ${sentinelResult.verdict}] ${sentinelResult.finding ?? 'trust gate failed'}` }],
            isError: true,
        };
    }
    // Seal the approved result
    const entry = sealEntry('FINDING', {
        tool: name,
        trust_score: sentinelResult.trust_score,
        result_preview: rawStr.slice(0, 200),
    }, name);
    const output = {
        ...rawResult,
        _agentscope: {
            seal: entry.seal,
            seq: entry.seq,
            trust_score: sentinelResult.trust_score,
            verdict: sentinelResult.verdict,
            entropy: bobResult.coherence.entropy,
        }
    };
    return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
});
async function dispatch(name, a) {
    switch (name) {
        case 'list_processes': return SIFT.list_processes(String(a.memory_image));
        case 'scan_network_connections': return SIFT.scan_network_connections(String(a.memory_image));
        case 'dump_cmdline': return SIFT.dump_cmdline(String(a.memory_image));
        case 'find_injected_code': return SIFT.find_injected_code(String(a.memory_image));
        case 'get_registry_hives': return SIFT.get_registry_hives(String(a.memory_image));
        case 'list_disk_partitions': return SIFT.list_disk_partitions(String(a.image_path));
        case 'list_files': return SIFT.list_files(String(a.image_path), a.offset);
        case 'get_filesystem_info': return SIFT.get_filesystem_info(String(a.image_path), a.offset);
        case 'scan_with_yara': return SIFT.scan_with_yara(String(a.rules_file), String(a.target_path));
        case 'extract_strings': return SIFT.extract_strings(String(a.file_path), a.min_length);
        case 'hash_file': return SIFT.hash_file(String(a.file_path));
        case 'get_file_metadata': return SIFT.get_file_metadata(String(a.file_path));
        case 'analyze_pcap': return SIFT.analyze_pcap(String(a.pcap_file));
        case 'verify_chain': {
            const { verifyChain } = await import('./pipeline/seal.js');
            return verifyChain();
        }
        default: throw new Error(`Unknown tool: ${name}`);
    }
}
// ── Start ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[AGENTSCOPE-SIFT] MCP server running — BOB + SENTINEL + SealForge active');
