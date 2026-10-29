import React from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  BookOpen,
  FlaskConical,
  TestTube2,
} from 'lucide-react';
import { ApStatus } from '../types/simulation';

interface HeaderProps {
  apStatus: ApStatus;
  apStartupStage: number;
  connectedClientsCount: number;
  maxClients: number;
  simClockMs: number;
  isClockRunning: boolean;
  clockSpeed: number;
  explanationMode: 'beginner' | 'engineering';
  onToggleClock: () => void;
  onSetSpeed: (speed: number) => void;
  onToggleExplanationMode: () => void;
  onRequestReset: () => void;
  onOpenTests: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  apStatus,
  apStartupStage,
  connectedClientsCount,
  maxClients,
  simClockMs,
  isClockRunning,
  clockSpeed,
  explanationMode,
  onToggleClock,
  onSetSpeed,
  onToggleExplanationMode,
  onRequestReset,
  onOpenTests,
  activeTab,
  onSelectTab,
}) => {
  // Format simulation clock mm:ss.SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds
      .toString()
      .padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (apStatus) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            RUNNING
          </span>
        );
      case 'STARTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <Activity className="w-3 h-3 animate-spin text-amber-600" />
            STARTING ({apStartupStage}/8)
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            STOPPED
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-2.5">
          {/* Brand & Technical Info */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-xs">
                <Radio className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-slate-900 tracking-tight">ESP32 Wi-Fi AP Lab</h1>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Mode: SoftAP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  IEEE 802.11b/g/n AP &middot; lwIP DHCP &middot; Educational Virtual Laboratory
                </p>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

            {/* Status indicators */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">AP:</span>
                {getStatusBadge()}
              </div>

              <div className="flex items-center gap-1 text-slate-600">
                <span className="text-slate-500">Clients:</span>
                <span className="font-mono font-medium text-slate-900">
                  {connectedClientsCount}/{maxClients}
                </span>
              </div>
            </div>
          </div>

          {/* Clock, Speed, Mode Toggle, and Actions */}
          <div className="flex items-center gap-2.5 flex-wrap justify-between md:justify-end">
            {/* Simulation Clock */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">CLOCK:</span>
              <span className="font-mono font-semibold text-slate-800 tracking-wider">
                {formatTime(simClockMs)}
              </span>
              <button
                onClick={onToggleClock}
                title={isClockRunning ? 'Pause simulation clock' : 'Resume simulation clock'}
                className="p-1 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                aria-label="Pause or Resume Clock"
              >
                {isClockRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>

              <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-0.5">
                {[1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetSpeed(s)}
                    className={`px-1 py-0.5 text-[10px] font-mono rounded ${
                      clockSpeed === s
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Beginner / Engineering Explanation toggle */}
            <button
              onClick={onToggleExplanationMode}
              title="Toggle between simple beginner explanations and detailed engineering networking details"
              className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline text-slate-500">Mode:</span>
              <span className="font-medium capitalize text-slate-900">{explanationMode}</span>
            </button>

            {/* Test Suite Button */}
            <button
              onClick={onOpenTests}
              title="Run 14 automated unit tests for Section 22"
              className="text-xs px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors flex items-center gap-1.5"
            >
              <TestTube2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>14 Tests</span>
            </button>

            {/* Global Reset Button */}
            <button
              onClick={onRequestReset}
              title="Reset simulation to initial state"
              className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto border-t border-slate-100 py-1 text-xs">
          {[
            { id: 'lab', label: '1. Simulation Lab' },
            { id: 'inspector', label: '2. Network Inspector' },
            { id: 'packets', label: '3. Packet Explorer' },
            { id: 'serial', label: '4. Serial Monitor' },
            { id: 'firmware', label: '5. Firmware' },
            { id: 'guide', label: '6. Learning Guide' },
            { id: 'experiments', label: 'Guided Experiments' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
