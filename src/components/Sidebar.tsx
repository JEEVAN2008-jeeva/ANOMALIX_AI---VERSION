import { useState } from 'react';
import {
  Activity,
  Bot,
  FileSearch,
  FileText,
  Gauge,
  GitBranch,
  HeartPulse,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/anomalix.ts';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  anomalyCount: number;
  criticalCount: number;
  crewStatus: string;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  Icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'monitoring', label: 'Security Monitoring', Icon: Activity },
  { id: 'logs', label: 'Log Explorer', Icon: FileSearch },
  { id: 'anomalies', label: 'Anomaly Detection', Icon: ShieldAlert },
  { id: 'agents', label: 'AI Agent Activity', Icon: Bot },
  { id: 'workflows', label: 'AI Agent Workflows', Icon: GitBranch },
  { id: 'investigations', label: 'Investigation Reports', Icon: FileText },
  { id: 'risk', label: 'Risk Assessment', Icon: Gauge },
  { id: 'health', label: 'System Health', Icon: HeartPulse },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  anomalyCount,
  criticalCount,
  crewStatus,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: NavSection) => {
    onSelectSection(id);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full surface-silver-gold border border-amber-300/80 rounded-2xl overflow-hidden shadow-sm">
      {/* Brand Wordmark */}
      <div className="px-5 py-5 border-b border-amber-300/70 bg-gradient-to-r from-[#f8f8fa]/95 via-[#fdf9ec]/95 to-[#eff5fb]/95">
        <div className="min-w-0">
          <div className="text-lg font-bold tracking-wider text-slate-900 leading-tight whitespace-nowrap">
            ANOMALIX AI
          </div>
          <div className="text-xs font-semibold text-amber-800 tracking-wide mt-0.5 truncate">
            Security Operations
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="SOC Primary Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleNav(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-sm rounded-md transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-600 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-blue-100 border border-amber-400/80 text-slate-900 font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-white/80 hover:text-slate-900 border border-transparent hover:border-amber-300/70'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-800' : 'text-amber-800/80'}`}
                  aria-hidden="true"
                />
                <span className="truncate whitespace-nowrap">{label}</span>
              </span>
              {id === 'anomalies' && anomalyCount > 0 && (
                <span
                  className={`text-xs tabular-nums px-1.5 py-0.5 rounded-sm font-bold ${
                    criticalCount > 0
                      ? 'text-red-800 bg-red-50 border border-red-300'
                      : 'text-amber-800 bg-amber-50 border border-amber-300'
                  }`}
                >
                  {anomalyCount}
                </span>
              )}
              {id === 'agents' && (
                <span
                  className={`text-xs whitespace-nowrap font-semibold ${
                    crewStatus === 'running' ? 'text-blue-800' : 'text-emerald-800'
                  }`}
                >
                  {crewStatus === 'running' ? 'Active' : '5 Agents'}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* CrewAI Architecture Footer Note */}
      <div className="px-4 py-3.5 border-t border-emerald-300/80 surface-green-spill">
        <div className="text-xs font-bold text-emerald-800 tracking-wide">
          CrewAI Sequential Engine
        </div>
        <div className="text-xs text-slate-700 mt-1 leading-relaxed">
          5 YAML-Configured Agents · Human-in-the-Loop Triage
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border border-amber-600/60 rounded-md shadow-lg text-sm font-bold"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Menu</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-xs p-4 flex">
          <div className="w-72 max-w-full h-full">{navContent}</div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar Rail */}
      <aside className="hidden lg:block w-64 shrink-0">{navContent}</aside>
    </>
  );
}
