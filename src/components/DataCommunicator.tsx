import React, { useState } from 'react';
import {
  Send,
  Activity,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  Radio,
  Zap,
} from 'lucide-react';
import { ClientDevice, DataTransfer } from '../types/simulation';

interface DataCommunicatorProps {
  clients: ClientDevice[];
  selectedClientId: string | null;
  transfers: DataTransfer[];
  isApRunning: boolean;
  onSendPing: (clientId: string) => void;
  onSendMessage: (clientId: string, message: string, bytes?: number) => void;
}

export const DataCommunicator: React.FC<DataCommunicatorProps> = ({
  clients,
  selectedClientId,
  transfers,
  isApRunning,
  onSendPing,
  onSendMessage,
}) => {
  const [activeSenderId, setActiveSenderId] = useState<string>(
    selectedClientId || clients[0]?.id || ''
  );
  const [customText, setCustomText] = useState('HELLO ESP32');
  const [selectedPayloadSize, setSelectedPayloadSize] = useState<number>(64);

  const connectedClients = clients.filter((c) => c.status === 'CONNECTED');
  const currentSender = clients.find((c) => c.id === activeSenderId);

  const presets = [
    { label: 'HELLO ESP32', value: 'HELLO ESP32', desc: 'Standard handshake message' },
    { label: 'STATUS', value: 'STATUS', desc: 'Query ESP32 uptime & heap memory' },
    { label: 'LED_ON', value: 'LED_ON', desc: 'Turn on simulated GPIO2 LED' },
    { label: 'LED_OFF', value: 'LED_OFF', desc: 'Turn off simulated GPIO2 LED' },
    { label: 'GET_TEMP', value: 'GET_TEMP', desc: 'Read internal temperature sensor' },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSenderId || !customText.trim()) return;
    onSendMessage(activeSenderId, customText.trim(), selectedPayloadSize);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 text-slate-800 rounded-md">
            <Send className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Data Communication Simulator</h2>
            <p className="text-xs text-slate-500">
              Transmit simulated application messages, ping ICMP packets, and benchmark payload transfers.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          Simulated lwIP Sockets
        </span>
      </div>

      {/* Control Bar: Select Client and Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Sender Device Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Source Client Station</label>
          <select
            value={activeSenderId}
            onChange={(e) => setActiveSenderId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white text-xs"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status === 'CONNECTED' ? c.assignedIp || 'No IP' : c.status})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            {currentSender?.status === 'CONNECTED'
              ? currentSender.assignedIp
                ? `Ready on IP: ${currentSender.assignedIp}`
                : 'Warning: Connected but no IP address (DHCP disabled)'
              : 'Station is not connected to AP'}
          </p>
        </div>

        {/* Quick Ping AP button */}
        <div className="flex flex-col justify-end">
          <button
            type="button"
            onClick={() => activeSenderId && onSendPing(activeSenderId)}
            className="w-full py-1.5 px-3 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            Ping SoftAP (ICMP Echo)
          </button>
          <p className="text-[10px] text-slate-400 mt-1 text-center">
            Tests layer-3 IP round-trip latency
          </p>
        </div>

        {/* Payload Size Preset */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Payload Size</label>
          <div className="grid grid-cols-4 gap-1">
            {[64, 256, 512, 1024].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedPayloadSize(size)}
                className={`py-1 text-xs font-mono rounded border transition-colors ${
                  selectedPayloadSize === size
                    ? 'bg-slate-900 text-white font-bold border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {size}B
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Simulated byte buffer</p>
        </div>
      </div>

      {/* Message Presets and Input Form */}
      <form onSubmit={handleSend} className="space-y-3 mb-5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-700">Application Message Payload</label>
            <div className="flex items-center gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setCustomText(preset.value)}
                  className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. HELLO ESP32, STATUS, LED_ON"
              className="flex-1 px-3 py-1.5 rounded-md border border-slate-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              Send to ESP32
            </button>
          </div>
        </div>
      </form>

      {/* Transfer History Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            Data Transfer Session History
          </h3>
          <span className="text-[11px] text-slate-400">
            {transfers.length} records logged
          </span>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
            No simulated data transfers yet. Click "Ping SoftAP" or "Send to ESP32" above.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Sender &rarr; Receiver</th>
                  <th className="py-2 px-3">Sent Payload</th>
                  <th className="py-2 px-3">ESP32 Reply</th>
                  <th className="py-2 px-3">Bytes</th>
                  <th className="py-2 px-3">RTT</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {transfers.slice(-8).reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      +{Math.round(t.simTimestampMs)}ms
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {t.senderName} &rarr; {t.receiverName}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-900 max-w-[150px] truncate">
                      "{t.message}"
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 max-w-[150px] truncate">
                      {t.replyMessage ? `"${t.replyMessage}"` : '&mdash;'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {t.payloadBytes} B
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {t.rttMs > 0 ? `${t.rttMs} ms` : '&mdash;'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {t.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          SUCCESS
                        </span>
                      ) : (
                        <span
                          title={t.errorReason}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded"
                        >
                          <XCircle className="w-3 h-3 text-rose-600" />
                          FAILED: {t.errorReason?.substring(0, 24)}...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
