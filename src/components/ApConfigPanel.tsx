import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Radio,
  Server,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { NetworkConfiguration } from '../types/simulation';
import { DEFAULT_CONFIG, validateConfiguration } from '../engine/simulationEngine';

interface ApConfigPanelProps {
  config: NetworkConfiguration;
  isApRunning: boolean;
  onUpdateConfig: (newConfig: NetworkConfiguration) => void;
  onRestartAp: () => void;
}

export const ApConfigPanel: React.FC<ApConfigPanelProps> = ({
  config,
  isApRunning,
  onUpdateConfig,
  onRestartAp,
}) => {
  const [formData, setFormData] = useState<NetworkConfiguration>({ ...config });
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const validation = validateConfiguration(formData);

  const handleChange = <K extends keyof NetworkConfiguration>(
    field: K,
    value: NetworkConfiguration[K]
  ) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setHasUnsavedChanges(true);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) return;
    onUpdateConfig(formData);
    setHasUnsavedChanges(false);
  };

  const handleRestoreDefaults = () => {
    setFormData({ ...DEFAULT_CONFIG });
    onUpdateConfig({ ...DEFAULT_CONFIG });
    setHasUnsavedChanges(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 text-slate-800 rounded-md">
            <Sliders className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">SoftAP Configuration</h2>
            <p className="text-xs text-slate-500">
              Configure ESP32 Wi-Fi radio parameters and lwIP DHCP pool.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestoreDefaults}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          Restore Defaults
        </button>
      </div>

      {isApRunning && hasUnsavedChanges && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span> The SoftAP is currently running. You must
            click "Apply &amp; Restart AP" for hardware parameters like SSID, Security, or IP to take
            effect in the ESP32 radio stack.
          </div>
        </div>
      )}

      <form onSubmit={handleApply} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SSID */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Network Name (SSID)
            </label>
            <input
              type="text"
              value={formData.ssid}
              onChange={(e) => handleChange('ssid', e.target.value)}
              maxLength={32}
              className={`w-full px-3 py-1.5 rounded-md border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                validation.errors.ssid ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {validation.errors.ssid ? (
              <p className="text-[11px] text-rose-600 mt-1">{validation.errors.ssid}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">1 to 32 characters (broadcast in beacons)</p>
            )}
          </div>

          {/* Security Mode */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Security Mode</label>
            <select
              value={formData.security}
              onChange={(e) =>
                handleChange('security', e.target.value as 'WPA2_PSK' | 'OPEN')
              }
              className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            >
              <option value="WPA2_PSK">WPA2-PSK (AES / CCMP)</option>
              <option value="OPEN">Open (No Password / Plaintext)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {formData.security === 'WPA2_PSK'
                ? 'Standard pre-shared key encryption'
                : 'No layer-2 authentication handshake'}
            </p>
          </div>

          {/* Password (WPA2-PSK) */}
          <div>
            <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
              <span>WPA2 Password</span>
              {formData.security === 'OPEN' && (
                <span className="text-[10px] text-slate-400 font-normal">Not required for Open</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                disabled={formData.security === 'OPEN'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                maxLength={63}
                placeholder={formData.security === 'OPEN' ? 'Network is Open' : '8 to 63 characters'}
                className={`w-full px-3 py-1.5 pr-8 rounded-md border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 ${
                  validation.errors.password
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-slate-300'
                }`}
              />
              {formData.security === 'WPA2_PSK' && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            {validation.errors.password ? (
              <p className="text-[11px] text-rose-600 mt-1">{validation.errors.password}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">8 to 63 ASCII characters</p>
            )}
          </div>

          {/* Wi-Fi Channel */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Wi-Fi Channel (2.4 GHz)
            </label>
            <select
              value={formData.channel}
              onChange={(e) => handleChange('channel', Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white font-mono"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((ch) => (
                <option key={ch} value={ch}>
                  Channel {ch} ({2407 + ch * 5} MHz)
                  {ch === 1 || ch === 6 || ch === 11 ? ' [Non-overlapping]' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Channels 1, 6, 11 are non-overlapping</p>
          </div>

          {/* AP IP Address */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">SoftAP Gateway IP</label>
            <input
              type="text"
              value={formData.apIp}
              onChange={(e) => handleChange('apIp', e.target.value)}
              className={`w-full px-3 py-1.5 rounded-md border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                validation.errors.apIp ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {validation.errors.apIp ? (
              <p className="text-[11px] text-rose-600 mt-1">{validation.errors.apIp}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Default ESP32 IP is 192.168.4.1</p>
            )}
          </div>

          {/* Subnet Mask */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Subnet Mask</label>
            <input
              type="text"
              value={formData.subnetMask}
              onChange={(e) => handleChange('subnetMask', e.target.value)}
              className={`w-full px-3 py-1.5 rounded-md border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                validation.errors.subnetMask
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300'
              }`}
            />
            {validation.errors.subnetMask ? (
              <p className="text-[11px] text-rose-600 mt-1">{validation.errors.subnetMask}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Typically 255.255.255.0 (/24)</p>
            )}
          </div>

          {/* Max Clients */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Maximum Stations (Clients)
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={formData.maxClients}
              onChange={(e) => handleChange('maxClients', Number(e.target.value))}
              className={`w-full px-3 py-1.5 rounded-md border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                validation.errors.maxClients
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300'
              }`}
            />
            {validation.errors.maxClients ? (
              <p className="text-[11px] text-rose-600 mt-1">{validation.errors.maxClients}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">ESP32 hardware supports 1 to 8</p>
            )}
          </div>

          {/* Beacon Interval */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Beacon Interval (ms)
            </label>
            <input
              type="number"
              min={50}
              max={1000}
              step={10}
              value={formData.beaconIntervalMs}
              onChange={(e) => handleChange('beaconIntervalMs', Number(e.target.value))}
              className={`w-full px-3 py-1.5 rounded-md border font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                validation.errors.beaconIntervalMs
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300'
              }`}
            />
            {validation.errors.beaconIntervalMs ? (
              <p className="text-[11px] text-rose-600 mt-1">{validation.errors.beaconIntervalMs}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Standard 802.11 TBTT is 100 TU (~102ms)</p>
            )}
          </div>
        </div>

        {/* DHCP Toggle */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dhcpEnabled"
              checked={formData.dhcpEnabled}
              onChange={(e) => handleChange('dhcpEnabled', e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
            />
            <label htmlFor="dhcpEnabled" className="text-slate-800 font-medium cursor-pointer">
              Enable lwIP DHCP Server Daemon
            </label>
          </div>
          <span className="text-[11px] text-slate-500">
            {formData.dhcpEnabled
              ? `Auto-leases IP pool: 192.168.4.2 &ndash; 192.168.4.${1 + formData.maxClients}`
              : 'Clients must configure Static Manual IP'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {isApRunning ? (
            <button
              type="button"
              onClick={() => {
                onUpdateConfig(formData);
                onRestartAp();
                setHasUnsavedChanges(false);
              }}
              disabled={!validation.valid}
              className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium shadow-xs transition-colors"
            >
              Apply &amp; Restart AP
            </button>
          ) : (
            <button
              type="submit"
              disabled={!validation.valid}
              className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium shadow-xs transition-colors"
            >
              Save Configuration
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
