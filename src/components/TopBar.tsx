import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Play,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { NotificationItem } from '../types/anomalix.ts';
import { formatTimestamp } from '../utils/formatters.ts';

interface TopBarProps {
  systemStatus: 'Operational' | 'Degraded' | 'Error';
  crewStatus: 'idle' | 'running' | 'completed' | 'error';
  lastScanTimestamp: string;
  notifications: NotificationItem[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenAnalyzeModal: () => void;
  onMarkAllRead: () => void;
  onSelectAnomalyNotification: (anomalyId: string) => void;
}

function formatLiveClock(date: Date): { dateStr: string; timeStr: string } {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return { dateStr, timeStr };
}

export function TopBar({
  systemStatus,
  crewStatus,
  lastScanTimestamp,
  notifications,
  isRefreshing,
  onRefresh,
  onOpenAnalyzeModal,
  onMarkAllRead,
  onSelectAnomalyNotification,
}: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const { dateStr, timeStr } = formatLiveClock(liveNow);

  return (
    <header className="sticky top-3 z-20 bg-gradient-to-r from-[#f8f8fa]/92 via-[#fdf9ec]/92 to-[#eff5fb]/92 backdrop-blur-md border border-amber-300/70 rounded-2xl px-6 py-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Zone 1: Branding & Real-Time Telemetry Date/Time Strip */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-x-2.5 gap-y-0.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
              ANOMALIX AI
            </h1>
            <span className="text-amber-700 hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-sm font-semibold text-amber-800 whitespace-nowrap">
              Security Operations Center
            </span>
          </div>
          <div className="flex items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1 flex-wrap tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800">
              <ShieldCheck
                className={`w-3.5 h-3.5 ${
                  crewStatus === 'running'
                    ? 'text-blue-700'
                    : systemStatus === 'Operational'
                      ? 'text-emerald-700'
                      : 'text-red-700'
                }`}
                aria-hidden="true"
              />
              <span>
                {crewStatus === 'running'
                  ? 'CrewAI Pipeline Running'
                  : `System ${systemStatus}`}
              </span>
            </span>
            <span className="hidden sm:inline text-amber-700/70" aria-hidden="true">·</span>
            <span
              className="inline-flex items-center gap-1.5 font-semibold text-slate-900"
              data-testid="live-realtime-clock"
              aria-label="Current system date and time"
            >
              <Clock className="w-3.5 h-3.5 text-blue-800 shrink-0" aria-hidden="true" />
              <span>{dateStr}</span>
              <span className="text-blue-800 font-bold">{timeStr}</span>
            </span>
            <span className="hidden md:inline text-amber-700/70" aria-hidden="true">·</span>
            <span className="text-slate-600">
              Last Scan: {formatTimestamp(lastScanTimestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Actions & Notifications */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh telemetry data"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border border-blue-400/70 bg-blue-50/90 text-blue-950 rounded-xl hover:bg-blue-100 transition-all duration-150 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-800 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <button
          type="button"
          onClick={onOpenAnalyzeModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border border-amber-500/80 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          <span>Run CrewAI Analysis</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={notifOpen}
            className="relative inline-flex items-center justify-center w-9 h-9 bg-white/90 border border-amber-300/80 rounded-xl text-amber-800 hover:bg-amber-50 transition-all duration-150 cursor-pointer"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 surface-silver-gold border border-amber-300 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-300/70 flex items-center justify-between bg-amber-50/60">
                <span className="text-sm font-bold text-slate-900">SOC Alert Feed</span>
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Mark all read</span>
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-amber-200/70">
                {notifications.length === 0 ? (
                  <div className="p-4 text-xs text-slate-600">No active notifications.</div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.anomalyId) {
                          onSelectAnomalyNotification(item.anomalyId);
                          setNotifOpen(false);
                        }
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-amber-50/70 transition-colors cursor-pointer ${
                        item.read ? 'opacity-75' : 'bg-white/95'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                        <span className="text-[11px] font-bold text-amber-800 shrink-0">{item.severity}</span>
                      </div>
                      <div className="text-xs text-slate-700 mt-1 line-clamp-2">{item.message}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
