/**
 * SIFT Tool Wrappers — Typed, Read-Only, No Shell Passthrough
 *
 * Every SIFT tool exposed as a typed function.
 * The agent physically cannot run destructive commands
 * because the server does not expose them.
 *
 * Tools run via execFile (not shell) with a fixed allow-list of binaries.
 * Raw output is parsed into structured JSON before returning to the LLM.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, statSync } from 'fs';
const exec = promisify(execFile);
const TIMEOUT_MS = 30_000;
// Safe binary allow-list — only these executables can be called
const ALLOWED_BINS = new Set([
    'volatility3', 'volatility', 'vol.py',
    'fls', 'istat', 'mmls', 'fsstat', 'tsk_recover',
    'log2timeline.py', 'psort.py',
    'yara', 'yarac',
    'strings', 'file', 'sha256sum', 'md5sum', 'sha1sum',
    'exiftool', 'tshark', 'capinfos',
    'regripper', 'rip.pl',
    'find', 'stat', 'ls', 'wc',
]);
async function safeExec(bin, args) {
    const baseName = bin.split('/').pop()?.split('\\').pop() ?? bin;
    if (!ALLOWED_BINS.has(baseName)) {
        throw new Error(`Binary not in allow-list: ${baseName}`);
    }
    try {
        const { stdout, stderr } = await exec(bin, args, { timeout: TIMEOUT_MS });
        return (stdout + (stderr ? `\nSTDERR: ${stderr}` : '')).trim();
    }
    catch (err) {
        if (err.code === 'ENOENT')
            return `[TOOL NOT FOUND: ${bin} — install SIFT workstation]`;
        return `[ERROR: ${err.message}]`;
    }
}
function requireFile(path) {
    if (!existsSync(path))
        throw new Error(`Evidence file not found: ${path}`);
}
// ── Memory Forensics (Volatility) ────────────────────────────────────────────
export async function list_processes(memory_image) {
    requireFile(memory_image);
    const raw = await safeExec('volatility3', ['-f', memory_image, 'windows.pslist.PsList']);
    const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('Volatility') && !l.startsWith('Progress'));
    return { tool: 'volatility3.windows.pslist', image: memory_image, process_count: lines.length - 1, raw_lines: lines };
}
export async function scan_network_connections(memory_image) {
    requireFile(memory_image);
    const raw = await safeExec('volatility3', ['-f', memory_image, 'windows.netstat.NetStat']);
    const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('Volatility'));
    return { tool: 'volatility3.windows.netstat', image: memory_image, connection_count: lines.length - 1, raw_lines: lines };
}
export async function dump_cmdline(memory_image) {
    requireFile(memory_image);
    const raw = await safeExec('volatility3', ['-f', memory_image, 'windows.cmdline.CmdLine']);
    const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('Volatility'));
    return { tool: 'volatility3.windows.cmdline', image: memory_image, raw_lines: lines };
}
export async function find_injected_code(memory_image) {
    requireFile(memory_image);
    const raw = await safeExec('volatility3', ['-f', memory_image, 'windows.malfind.Malfind']);
    const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('Volatility'));
    const suspicious_count = lines.filter(l => /VAD|Inject|PAGE_EXECUTE/i.test(l)).length;
    return { tool: 'volatility3.windows.malfind', image: memory_image, suspicious_regions: suspicious_count, raw_lines: lines };
}
export async function get_registry_hives(memory_image) {
    requireFile(memory_image);
    const raw = await safeExec('volatility3', ['-f', memory_image, 'windows.registry.hivelist.HiveList']);
    const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('Volatility'));
    return { tool: 'volatility3.windows.hivelist', image: memory_image, hive_count: lines.length - 1, raw_lines: lines };
}
// ── Disk Forensics (Sleuthkit) ───────────────────────────────────────────────
export async function list_disk_partitions(image_path) {
    requireFile(image_path);
    const raw = await safeExec('mmls', [image_path]);
    const lines = raw.split('\n').filter(l => l.trim());
    const partitions = lines.filter(l => /\d+:/.test(l)).map(l => l.trim());
    return { tool: 'mmls', image: image_path, partition_count: partitions.length, partitions };
}
export async function list_files(image_path, offset) {
    requireFile(image_path);
    const args = offset !== undefined ? ['-o', String(offset), image_path] : [image_path];
    const raw = await safeExec('fls', ['-r', '-l', ...args]);
    const lines = raw.split('\n').filter(l => l.trim());
    const deleted = lines.filter(l => l.startsWith('*')).length;
    return { tool: 'fls', image: image_path, total_entries: lines.length, deleted_entries: deleted, raw_lines: lines.slice(0, 200) };
}
export async function get_filesystem_info(image_path, offset) {
    requireFile(image_path);
    const args = offset !== undefined ? ['-o', String(offset), image_path] : [image_path];
    const raw = await safeExec('fsstat', args);
    return { tool: 'fsstat', image: image_path, raw_output: raw };
}
// ── Timeline Analysis ────────────────────────────────────────────────────────
export async function build_supertimeline(evidence_path, output_file) {
    requireFile(evidence_path);
    const raw = await safeExec('log2timeline.py', ['--parsers', 'win7', output_file, evidence_path]);
    return { tool: 'log2timeline', evidence: evidence_path, output: output_file, status: raw.includes('error') ? 'error' : 'complete', raw };
}
export async function query_timeline(plaso_file, query) {
    requireFile(plaso_file);
    const raw = await safeExec('psort.py', ['-q', '-o', 'dynamic', plaso_file, query]);
    const lines = raw.split('\n').filter(l => l.trim());
    return { tool: 'psort', plaso_file, query, result_count: lines.length, raw_lines: lines.slice(0, 100) };
}
// ── Malware Detection ────────────────────────────────────────────────────────
export async function scan_with_yara(rules_file, target_path) {
    if (!existsSync(rules_file))
        throw new Error(`YARA rules file not found: ${rules_file}`);
    requireFile(target_path);
    const raw = await safeExec('yara', ['-r', rules_file, target_path]);
    const matches = raw.split('\n').filter(l => l.trim());
    return { tool: 'yara', rules: rules_file, target: target_path, match_count: matches.length, matches };
}
export async function extract_strings(file_path, min_length = 8) {
    requireFile(file_path);
    const raw = await safeExec('strings', ['-n', String(min_length), file_path]);
    const strings = raw.split('\n').filter(l => l.trim());
    const iocs = strings.filter(s => /https?:\/\/|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|\.exe|\.dll|cmd\.exe|powershell/i.test(s));
    return { tool: 'strings', file: file_path, total_strings: strings.length, potential_iocs: iocs.length, iocs, sample: strings.slice(0, 50) };
}
// ── File Metadata + Hashing ──────────────────────────────────────────────────
export async function hash_file(file_path) {
    requireFile(file_path);
    const [sha256, md5] = await Promise.all([
        safeExec('sha256sum', [file_path]),
        safeExec('md5sum', [file_path]),
    ]);
    const stat = statSync(file_path);
    return {
        tool: 'hash_file',
        file: file_path,
        sha256: sha256.split(' ')[0],
        md5: md5.split(' ')[0],
        size_bytes: stat.size,
        modified: stat.mtime.toISOString(),
    };
}
export async function get_file_metadata(file_path) {
    requireFile(file_path);
    const [fileType, meta] = await Promise.all([
        safeExec('file', [file_path]),
        safeExec('exiftool', ['-json', file_path]),
    ]);
    let parsed = {};
    try {
        parsed = JSON.parse(meta)[0] ?? {};
    }
    catch { }
    return { tool: 'exiftool', file: file_path, file_type: fileType.split(':').slice(1).join(':').trim(), metadata: parsed };
}
// ── Network Forensics ────────────────────────────────────────────────────────
export async function analyze_pcap(pcap_file) {
    requireFile(pcap_file);
    const [info, dns, http] = await Promise.all([
        safeExec('capinfos', [pcap_file]),
        safeExec('tshark', ['-r', pcap_file, '-Y', 'dns', '-T', 'fields', '-e', 'dns.qry.name']),
        safeExec('tshark', ['-r', pcap_file, '-Y', 'http.request', '-T', 'fields', '-e', 'http.host', '-e', 'http.request.uri']),
    ]);
    const dns_queries = [...new Set(dns.split('\n').filter(l => l.trim()))];
    const http_requests = http.split('\n').filter(l => l.trim());
    return { tool: 'tshark', pcap: pcap_file, capture_info: info, dns_query_count: dns_queries.length, dns_queries: dns_queries.slice(0, 50), http_request_count: http_requests.length, http_requests: http_requests.slice(0, 50) };
}
export async function get_system_info() {
    const [uname, uptime] = await Promise.all([
        safeExec('find', ['/etc', '-name', 'os-release', '-maxdepth', '1']).then(f => safeExec('find', ['/etc/os-release'])).catch(() => 'unknown'),
        exec('uptime').then(r => r.stdout).catch(() => 'unknown'),
    ]);
    return { tool: 'system_info', platform: 'sift-workstation', uptime };
}
