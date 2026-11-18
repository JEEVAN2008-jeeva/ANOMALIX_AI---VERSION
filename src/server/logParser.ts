import type { LogValidationSummary, NormalizedLogEntry } from '../types/anomalix.ts';

const SECRET_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  { regex: /(password|passwd|pwd)\s*[:=]\s*([^\s,;"]+)/gi, replacement: '$1=[MASKED]' },
  { regex: /(token|api_key|apikey|secret|auth_key)\s*[:=]\s*([^\s,;"]+)/gi, replacement: '$1=[MASKED]' },
  { regex: /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, replacement: '$1[MASKED]' },
];

export function maskSensitiveText(input: string): { text: string; masked: boolean } {
  let text = input;
  let masked = false;
  for (const { regex, replacement } of SECRET_PATTERNS) {
    const next = text.replace(regex, replacement);
    if (next !== text) {
      masked = true;
      text = next;
    }
  }
  return { text, masked };
}

function detectFormat(rawContent: string, fileName: string): 'CSV' | 'JSON' | 'TXT' {
  const trimmed = rawContent.trim();
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return 'JSON';
  }
  if (lower.endsWith('.csv') || (trimmed.includes(',') && /^(timestamp|time|date|ip|source_ip)/im.test(trimmed.split('\n')[0] || ''))) {
    return 'CSV';
  }
  return 'TXT';
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function isValidIp(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || ip.includes(':');
}

export function parseAndValidateLogs(
  rawContent: string,
  fileName: string = 'server_logs.csv'
): { entries: NormalizedLogEntry[]; summary: LogValidationSummary } {
  const format = detectFormat(rawContent, fileName);
  const entries: NormalizedLogEntry[] = [];
  let malformedRows = 0;
  let maskedSecretsCount = 0;
  let totalRows = 0;

  if (format === 'JSON') {
    try {
      const parsed = JSON.parse(rawContent);
      const items: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { logs?: unknown[] }).logs)
          ? (parsed as { logs: unknown[] }).logs
          : [parsed];
      totalRows = items.length;

      items.forEach((item, idx) => {
        if (!item || typeof item !== 'object') {
          malformedRows++;
          return;
        }
        const rec = item as Record<string, unknown>;
        const rawLine = JSON.stringify(rec);
        const { text: maskedLine, masked } = maskSensitiveText(rawLine);
        if (masked) maskedSecretsCount++;

        const timestamp = String(rec.timestamp || rec.time || rec.ts || '');
        const sourceIp = String(rec.sourceIp || rec.source_ip || rec.ip || '');
        const username = String(rec.username || rec.user || rec.actor || 'anonymous');
        const eventType = String(rec.eventType || rec.event_type || rec.event || rec.action || 'UNKNOWN');
        const statusCode = Number(rec.statusCode ?? rec.status_code ?? rec.status ?? 200);
        const endpoint = String(rec.endpoint || rec.path || rec.resource || '/');
        const bytes = Number(rec.bytes ?? rec.size ?? 512);

        const isMalformed = !timestamp || !isValidIp(sourceIp) || Number.isNaN(statusCode);
        if (isMalformed) malformedRows++;

        entries.push({
          id: `LOG-${String(idx + 1).padStart(4, '0')}`,
          lineNumber: idx + 1,
          timestamp: timestamp || new Date().toISOString(),
          sourceIp: sourceIp || '0.0.0.0',
          username: maskSensitiveText(username).text,
          eventType,
          statusCode: Number.isNaN(statusCode) ? 0 : statusCode,
          endpoint: maskSensitiveText(endpoint).text,
          bytes: Number.isNaN(bytes) ? 0 : bytes,
          masked,
          malformed: isMalformed,
          rawLine: maskedLine,
        });
      });
    } catch {
      malformedRows = 1;
      totalRows = 1;
    }
  } else if (format === 'CSV') {
    const lines = rawContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      return {
        entries: [],
        summary: {
          fileName,
          format,
          totalRows: 0,
          validRows: 0,
          malformedRows: 0,
          maskedSecretsCount: 0,
          uniqueIps: 0,
          uniqueUsers: 0,
        },
      };
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const hasHeader = headers.some((h) => ['timestamp', 'ip', 'sourceip', 'source_ip', 'event', 'eventtype', 'event_type'].includes(h));
    const startIdx = hasHeader ? 1 : 0;
    totalRows = lines.length - startIdx;

    const colIndex = (names: string[], fallback: number): number => {
      if (!hasHeader) return fallback;
      const found = headers.findIndex((h) => names.includes(h));
      return found >= 0 ? found : fallback;
    };

    const tsIdx = colIndex(['timestamp', 'time', 'ts', 'date'], 0);
    const ipIdx = colIndex(['source_ip', 'sourceip', 'ip', 'client_ip'], 1);
    const userIdx = colIndex(['username', 'user', 'actor'], 2);
    const eventIdx = colIndex(['event_type', 'eventtype', 'event', 'action'], 3);
    const statusIdx = colIndex(['status_code', 'statuscode', 'status', 'code'], 4);
    const endpointIdx = colIndex(['endpoint', 'path', 'uri', 'resource'], 5);
    const bytesIdx = colIndex(['bytes', 'size', 'response_bytes'], 6);

    for (let i = startIdx; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const { text: maskedLine, masked } = maskSensitiveText(lines[i]);
      if (masked) maskedSecretsCount++;

      const timestamp = cols[tsIdx] || '';
      const sourceIp = cols[ipIdx] || '';
      const username = cols[userIdx] || 'anonymous';
      const eventType = cols[eventIdx] || 'UNKNOWN';
      const statusCode = Number(cols[statusIdx]);
      const endpoint = cols[endpointIdx] || '/';
      const bytes = Number(cols[bytesIdx] || 512);

      const isMalformed = cols.length < 4 || !timestamp || !isValidIp(sourceIp) || Number.isNaN(statusCode);
      if (isMalformed) malformedRows++;

      entries.push({
        id: `LOG-${String(entries.length + 1).padStart(4, '0')}`,
        lineNumber: i + 1,
        timestamp: timestamp || new Date().toISOString(),
        sourceIp: sourceIp || '0.0.0.0',
        username: maskSensitiveText(username).text,
        eventType,
        statusCode: Number.isNaN(statusCode) ? 0 : statusCode,
        endpoint: maskSensitiveText(endpoint).text,
        bytes: Number.isNaN(bytes) ? 0 : bytes,
        masked,
        malformed: isMalformed,
        rawLine: maskedLine,
      });
    }
  } else {
    // TXT / Syslog format
    const lines = rawContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    totalRows = lines.length;

    lines.forEach((line, idx) => {
      const { text: maskedLine, masked } = maskSensitiveText(line);
      if (masked) maskedSecretsCount++;

      const tsMatch = maskedLine.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
      const ipMatch = maskedLine.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      const userMatch = maskedLine.match(/(?:user|username|actor)[=:\s]+([A-Za-z0-9_.-]+)/i);
      const statusMatch = maskedLine.match(/(?:status|code)[=:\s]+(\d{3})\b/i) || maskedLine.match(/\b([1-5]\d{2})\b/);
      const eventMatch = maskedLine.match(/(?:event|action|type)[=:\s]+([A-Za-z0-9_.-]+)/i);
      const pathMatch = maskedLine.match(/(\/[A-Za-z0-9_./-]+)/);

      const timestamp = tsMatch ? tsMatch[0].replace(' ', 'T') : '';
      const sourceIp = ipMatch ? ipMatch[0] : '';
      const statusCode = statusMatch ? Number(statusMatch[1]) : 200;
      const isMalformed = !timestamp || !sourceIp;
      if (isMalformed) malformedRows++;

      entries.push({
        id: `LOG-${String(idx + 1).padStart(4, '0')}`,
        lineNumber: idx + 1,
        timestamp: timestamp || new Date().toISOString(),
        sourceIp: sourceIp || '0.0.0.0',
        username: userMatch ? userMatch[1] : 'system',
        eventType: eventMatch ? eventMatch[1] : maskedLine.toLowerCase().includes('fail') ? 'AUTH_FAILURE' : 'ACCESS_EVENT',
        statusCode,
        endpoint: pathMatch ? pathMatch[1] : '/',
        bytes: 512,
        masked,
        malformed: isMalformed,
        rawLine: maskedLine,
      });
    });
  }

  const validEntries = entries.filter((e) => !e.malformed);
  const uniqueIps = new Set(validEntries.map((e) => e.sourceIp)).size;
  const uniqueUsers = new Set(validEntries.map((e) => e.username)).size;

  return {
    entries,
    summary: {
      fileName,
      format,
      totalRows,
      validRows: validEntries.length,
      malformedRows,
      maskedSecretsCount,
      uniqueIps,
      uniqueUsers,
    },
  };
}
