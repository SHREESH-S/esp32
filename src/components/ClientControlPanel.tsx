import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  Cpu,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Send,
  Trash2,
  Signal,
} from 'lucide-react';
import { ClientDevice, DeviceType } from '../types/simulation';

interface ClientControlPanelProps {
  client: ClientDevice;
  isApRunning: boolean;
  onUpdateClient: (updated: ClientDevice) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
  onPing: () => void;
  onSendMessage: () => void;
}

export const ClientControlPanel: React.FC<ClientControlPanelProps> = ({
  client,
  isApRunning,
  onUpdateClient,
  onConnect,
  onDisconnect,
  onDelete,
  onPing,
  onSendMessage,
}) => {
  const [isEditingStaticIp, setIsEditingStaticIp] = useState(client.useManualIp);

  const isConnected = client.status === 'CONNECTED';
  const isFailed = client.status === 'FAILED';
  const isConnecting =
    client.status === 'SCANNING' ||
    client.status === 'NETWORK_FOUND' ||
    client.status === 'AUTHENTICATING' ||
    client.status === 'ASSOCIATING' ||
    client.status === 'REQUESTING_IP';

  const handleFieldChange = <K extends keyof ClientDevice>(field: K, val: ClientDevice[K]) => {
    onUpdateClient({ ...client, [field]: val });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
            {client.type === 'smartphone' && <Smartphone className="w-4 h-4 text-sky-600" />}
            {client.type === 'laptop' && <Laptop className="w-4 h-4 text-sky-600" />}
            {client.type === 'tablet' && <Tablet className="w-4 h-4 text-sky-600" />}
            {client.type === 'iot_device' && <Cpu className="w-4 h-4 text-sky-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={client.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="font-semibold text-slate-900 text-sm border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none transition-colors"
              />
              <span className="text-[11px] font-mono text-slate-500">({client.macAddress})</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Station State: <strong className="text-slate-700">{client.status}</strong> &middot; RSSI:{' '}
              {client.rssiDbm} dBm
            </p>
          </div>
        </div>

        {/* Connect / Disconnect Action */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              onClick={onDisconnect}
              className="px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting || !isApRunning}
              title={!isApRunning ? 'Cannot connect: Access Point is stopped' : ''}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              {isConnecting ? 'Connecting...' : 'Connect to AP'}
            </button>
          )}

          <button
            onClick={onDelete}
            title="Remove device"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection State Machine Visual Progress Bar */}
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="text-[11px] font-medium text-slate-600 mb-2 flex items-center justify-between">
          <span>802.11 &amp; IP State Progression</span>
          <span className="font-mono text-slate-900">{client.status}</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
          {[
            { id: 'OFFLINE', label: '1. Offline' },
            { id: 'SCANNING', label: '2. Scan' },
            { id: 'AUTHENTICATING', label: '3. Auth' },
            { id: 'ASSOCIATING', label: '4. Assoc' },
            { id: 'REQUESTING_IP', label: '5. DHCP/IP' },
            { id: 'CONNECTED', label: '6. Connected' },
          ].map((st, i) => {
            const isActive = client.status === st.id;
            const isPast =
              (client.status === 'CONNECTED' && i <= 5) ||
              (client.status === 'ASSOCIATING' && i <= 3) ||
              (client.status === 'AUTHENTICATING' && i <= 2) ||
              (client.status === 'SCANNING' && i <= 1);

            return (
              <div
                key={st.id}
                className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : isPast
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {st.label}
              </div>
            );
          })}
        </div>

        {/* Status description */}
        <p className="text-xs text-slate-600 mt-2 font-sans">{client.lastEventDescription}</p>

        {/* Failure reason if any */}
        {client.failureReason && (
          <div className="mt-2 p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Reason for failure:</span> {client.failureReason}
            </div>
          </div>
        )}
      </div>

      {/* Network Configuration Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
        <div>
          <label className="block text-slate-600 font-medium mb-1">Target SSID</label>
          <input
            type="text"
            disabled={isConnected || isConnecting}
            value={client.targetSsid}
            onChange={(e) => handleFieldChange('targetSsid', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">SSID network name to join</p>
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">Input Password</label>
          <input
            type="text"
            disabled={isConnected || isConnecting}
            value={client.inputPassword}
            onChange={(e) => handleFieldChange('inputPassword', e.target.value)}
            placeholder="Network password"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">Test wrong password to verify auth rejection</p>
        </div>
      </div>

      {/* Static Manual IP Mode */}
      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 mb-4 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`manual-ip-${client.id}`}
              disabled={isConnected || isConnecting}
              checked={client.useManualIp}
              onChange={(e) => handleFieldChange('useManualIp', e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
            />
            <label
              htmlFor={`manual-ip-${client.id}`}
              className="text-slate-800 font-medium cursor-pointer"
            >
              Configure Manual Static IP (Bypasses DHCP)
            </label>
          </div>
        </div>

        {client.useManualIp && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Static IP</label>
              <input
                type="text"
                disabled={isConnected || isConnecting}
                value={client.manualIp || '192.168.4.50'}
                onChange={(e) => handleFieldChange('manualIp', e.target.value)}
                className="w-full px-2 py-1 rounded border border-slate-300 font-mono text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Subnet Mask</label>
              <input
                type="text"
                disabled={isConnected || isConnecting}
                value={client.manualSubnet || '255.255.255.0'}
                onChange={(e) => handleFieldChange('manualSubnet', e.target.value)}
                className="w-full px-2 py-1 rounded border border-slate-300 font-mono text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Default Gateway</label>
              <input
                type="text"
                disabled={isConnected || isConnecting}
                value={client.manualGateway || '192.168.4.1'}
                onChange={(e) => handleFieldChange('manualGateway', e.target.value)}
                className="w-full px-2 py-1 rounded border border-slate-300 font-mono text-xs bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Connection Metrics if connected */}
      {isConnected && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Connected to SoftAP
            </div>
            <p className="font-mono text-emerald-800 text-[11px]">
              Assigned IP: <strong>{client.assignedIp || 'None (No IPv4)'}</strong> &middot; Gateway:{' '}
              {client.assignedGateway || 'None'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPing}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-medium rounded border border-emerald-300 transition-colors shadow-2xs"
            >
              Ping AP
            </button>
            <button
              onClick={onSendMessage}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-colors shadow-2xs"
            >
              Send Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
