import { AlertOctagon, AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import type { AnomalyStatus, RiskLevel } from '../types/anomalix.ts';

interface SeverityBadgeProps {
  level: RiskLevel;
  score?: number;
}

export function SeverityBadge({ level, score }: SeverityBadgeProps) {
  const config: Record<
    RiskLevel,
    { border: string; bg: string; text: string; Icon: typeof AlertOctagon }
  > = {
    Critical: {
      border: 'border-red-400/80',
      bg: 'bg-red-50/95',
      text: 'text-red-800',
      Icon: AlertOctagon,
    },
    High: {
      border: 'border-amber-400/80',
      bg: 'bg-amber-50/95',
      text: 'text-amber-900',
      Icon: ShieldAlert,
    },
    Medium: {
      border: 'border-blue-400/80',
      bg: 'bg-blue-50/95',
      text: 'text-blue-800',
      Icon: AlertTriangle,
    },
    Low: {
      border: 'border-emerald-400/80',
      bg: 'bg-emerald-50/95',
      text: 'text-emerald-800',
      Icon: Info,
    },
  };

  const { border, bg, text, Icon } = config[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold tracking-wide border ${border} ${bg} ${text} rounded-sm whitespace-nowrap shrink-0 tabular-nums`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{level}</span>
      {typeof score === 'number' && <span className="opacity-85">({score})</span>}
    </span>
  );
}

export function StatusIndicator({ status }: { status: AnomalyStatus }) {
  const styles: Record<AnomalyStatus, string> = {
    Escalated: 'text-red-800 border-red-400/75 bg-red-50/90',
    Investigating: 'text-amber-900 border-amber-400/75 bg-amber-50/90',
    Open: 'text-blue-800 border-blue-400/75 bg-blue-50/90',
    Resolved: 'text-emerald-800 border-emerald-400/75 bg-emerald-50/90',
    'False Positive': 'text-slate-700 border-slate-300 bg-slate-100/90',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold border rounded-sm whitespace-nowrap shrink-0 ${styles[status]}`}
    >
      {status === 'Resolved' && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
      <span>{status}</span>
    </span>
  );
}
