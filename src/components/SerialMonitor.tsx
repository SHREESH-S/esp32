import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Copy,
  Download,
  Trash2,
  Pause,
  Play,
  Search,
  Check,
  Filter,
} from 'lucide-react';
import { SerialLogEntry } from '../types/simulation';

interface SerialMonitorProps {
  logs: SerialLogEntry[];
  onClearLogs: () => void;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({ logs, onClearLogs }) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new logs arrive and autoScroll is enabled
  useEffect(() => {
    if (autoScroll && !isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused]);

  const displayedLogs = logs.filter((entry) => {
    if (filterLevel !== 'all' && entry.level !== filterLevel) return false;
    if (searchTerm && !entry.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleCopy = () => {
    const textToCopy = displayedLogs
      .map((l) => `[${l.simTimestampMs.toString().padStart(5, '0')} ms] ${l.text}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const textContent =
      `# ESP32 Wi-Fi AP Lab - Serial Monitor Log Export\n` +
      `# Note: All records are simulated firmware events generated in browser\n` +
      `# Timestamp format: [simulation ms]\n\n` +
      displayedLogs
        .map((l) => `[${l.simTimestampMs.toString().padStart(5, '0')} ms] ${l.text}`)
        .join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esp32_serial_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: SerialLogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-rose-400 font-semibold';
      case 'warn':
        return 'text-amber-300';
      case 'debug':
        return 'text-slate-400';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-200 font-semibold text-xs tracking-wide">
            ESP32 UART0 Console &middot; 115200 Baud (Simulated)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter serial logs..."
              className="pl-6 pr-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-sky-500 w-36"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>

          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live log stream' : 'Pause log stream'}
            className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors ${
              isPaused
                ? 'bg-amber-950/80 border border-amber-600 text-amber-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'Paused' : 'Live'}
          </button>

          {/* Auto Scroll */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded text-[11px] border ${
              autoScroll
                ? 'bg-sky-950/60 border-sky-600 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Auto-Scroll
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export .txt
          </button>

          {/* Clear */}
          <button
            onClick={onClearLogs}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
            title="Clear serial monitor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={scrollRef}
        className="p-4 h-96 overflow-y-auto space-y-1 text-[11.5px] leading-relaxed selection:bg-sky-900 selection:text-white"
      >
        <div className="text-slate-500 pb-2 border-b border-slate-800/80 mb-2">
          --- ESP32 SoftAP Serial Console Connected [Virtual Lab Environment] ---
        </div>

        {displayedLogs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">
            No serial messages recorded. Start the SoftAP or trigger network activity.
          </div>
        ) : (
          displayedLogs.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 hover:bg-slate-800/40 px-1 rounded">
              <span className="text-slate-500 select-none shrink-0 font-mono text-[11px]">
                [{entry.simTimestampMs.toString().padStart(5, '0')} ms]
              </span>
              <span className={`break-all ${getLevelColor(entry.level)}`}>{entry.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Terminal Footer */}
      <div className="bg-slate-950 px-4 py-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
        <span>Encoding: UTF-8 &middot; Flow Control: None &middot; Parity: 8-N-1</span>
        <span>{displayedLogs.length} lines logged</span>
      </div>
    </div>
  );
};
