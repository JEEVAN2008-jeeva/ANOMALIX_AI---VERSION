import type { RiskLevel } from '../types/anomalix.ts';

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }) + ' UTC';
}

export function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return `${ms || 0} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function getRiskAccentHex(level: RiskLevel): string {
  switch (level) {
    case 'Critical':
      return '#dc2626';
    case 'High':
      return '#d97706';
    case 'Medium':
      return '#2563eb';
    case 'Low':
      return '#059669';
  }
}

export function downloadTextFile(filename: string, content: string, mimeType: string = 'text/markdown'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
