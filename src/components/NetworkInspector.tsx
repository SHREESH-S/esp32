import React, { useState } from 'react';
import {
  Network,
  Radio,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  RefreshCw,
  ArrowRight,
  Database,
  Info,
  Server,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  ApStatus,
  ClientDevice,
  DhcpLease,
  NetworkConfiguration,
} from '../types/simulation';

interface NetworkInspectorProps {
  config: NetworkConfiguration;
  apStatus: ApStatus;
  apBssid: string;
  clients: ClientDevice[];
  dhcpLeases: DhcpLease[];
  simClockMs: number;
  onSelectClient: (clientId: string) => void;
  onDisconnectClient: (clientId: string) => void;
}

export const NetworkInspector: React.FC<NetworkInspectorProps> = ({
  config,
  apStatus,
  apBssid,
  clients,
  dhcpLeases,
  simClockMs,
  onSelectClient,
  onDisconnectClient,
}) => {
  const [filter, setFilter] = useState<'all' | 'connected' | 'connecting' | 'disconnected' | 'failed'>(
    'all'
  );
  const [inspectedClient, setInspectedClient] = useState<ClientDevice | null>(null);

  const filteredClients = clients.filter((client) => {
    if (filter === 'all') return true;
    if (filter === 'connected') return client.status === 'CONNECTED';
    if (filter === 'connecting') {
      return (
        client.status === 'SCANNING' ||
        client.status === 'AUTHENTICATING' ||
        client.status === 'ASSOCIATING' ||
        client.status === 'REQUESTING_IP'
      );
    }
    if (filter === 'disconnected') return client.status === 'DISCONNECTED' || client.status === 'OFFLINE';
    if (filter === 'failed') return client.status === 'FAILED';
    return true;
  });

  const totalTxBytes = clients.reduce((acc, c) => acc + c.txBytes, 0);
  const totalRxBytes = clients.reduce((acc, c) => acc + c.rxBytes, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: SoftAP Station & Interface Architecture */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 text-slate-800 rounded-md">
              <Network className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Network Interface Inspector</h2>
              <p className="text-xs text-slate-500">
                Live IEEE 802.11 BSSID hardware descriptor, IP subnets, and station association table.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Interface: esp_netif_ap
          </span>
        </div>

        {/* Technical Specification Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="block text-[10px] text-slate-400 font-sans uppercase">SoftAP BSSID (MAC)</span>
            <span className="font-bold text-slate-900 text-xs">{apBssid}</span>
            <span className="block text-[10px] text-slate-500 mt-1 font-sans">Simulated Espressif OUI</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="block text-[10px] text-slate-400 font-sans uppercase">Gateway IP / Netmask</span>
            <span className="font-bold text-sky-700 text-xs">{config.apIp}</span>
            <span className="block text-[10px] text-slate-500 mt-1">{config.subnetMask}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="block text-[10px] text-slate-400 font-sans uppercase">802.11 Channel &amp; Security</span>
            <span className="font-bold text-slate-900 text-xs">Ch {config.channel} &middot; {config.security}</span>
            <span className="block text-[10px] text-slate-500 mt-1 font-sans">Beacon: {config.beaconIntervalMs}ms</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="block text-[10px] text-slate-400 font-sans uppercase">Cumulative Traffic</span>
            <span className="font-bold text-slate-900 text-xs">TX: {totalTxBytes} B &middot; RX: {totalRxBytes} B</span>
            <span className="block text-[10px] text-slate-500 mt-1 font-sans">Simulated lwIP buffers</span>
          </div>
        </div>
      </div>

      {/* Connected Clients Association Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Associated Stations Table</h3>
            <p className="text-xs text-slate-500">
              Active stations connected to the ESP32 SoftAP Basic Service Set (BSS).
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {(['all', 'connected', 'connecting', 'disconnected', 'failed'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  filter === mode
                    ? 'bg-slate-900 text-white font-medium shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Device</th>
                <th className="py-2.5 px-3">Simulated MAC</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Assigned IP</th>
                <th className="py-2.5 px-3">Signal (RSSI)</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">TX / RX</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No client stations match filter "{filter}".
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isConn = client.status === 'CONNECTED';
                  const uptimeSec = client.connectedAtSimMs
                    ? Math.max(0, Math.floor((simClockMs - client.connectedAtSimMs) / 1000))
                    : 0;

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setInspectedClient(client)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {client.name}
                        <span className="block text-[10px] text-slate-400 font-normal capitalize">
                          {client.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {client.macAddress}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-medium ${
                            isConn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : client.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800">
                        {client.assignedIp ? (
                          <span className="font-semibold text-sky-700">{client.assignedIp}</span>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {client.rssiDbm} dBm
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {isConn ? `${uptimeSec}s` : '&mdash;'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                        {client.txBytes}B / {client.rxBytes}B
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedClient(client);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DHCP Active Leases Pool Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 text-slate-800 rounded-md">
              <Database className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">DHCP Lease Memory Table</h3>
              <p className="text-xs text-slate-500">
                Dynamic host allocation table managed by ESP32 lwIP DHCP daemon.
              </p>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
              config.dhcpEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            DHCP Server: {config.dhcpEnabled ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>

        {dhcpLeases.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
            No active or released DHCP leases recorded. Connect a client to observe DORA lease allocation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                <tr>
                  <th className="py-2 px-3">Client Hostname</th>
                  <th className="py-2 px-3">Client Hardware MAC</th>
                  <th className="py-2 px-3">Assigned IPv4</th>
                  <th className="py-2 px-3">Lease Issued</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dhcpLeases.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {l.hostname}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{l.clientMac}</td>
                    <td className="py-2.5 px-3 font-bold text-sky-700">{l.clientIp}</td>
                    <td className="py-2.5 px-3 text-slate-500">+{Math.round(l.issuedAtSimMs)}ms</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          l.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Client Inspector Drawer Modal */}
      {inspectedClient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setInspectedClient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-slate-100 rounded-lg text-sky-600">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{inspectedClient.name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Station Hardware MAC: {inspectedClient.macAddress}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Association State:</span>
                  <span className="font-bold text-slate-900">{inspectedClient.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Assigned IPv4:</span>
                  <span className="font-bold text-sky-700">
                    {inspectedClient.assignedIp || 'None (0.0.0.0)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Default Gateway:</span>
                  <span>{inspectedClient.assignedGateway || config.apIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Subnet Mask:</span>
                  <span>{inspectedClient.assignedSubnet || config.subnetMask}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Radio Signal:</span>
                  <span>{inspectedClient.rssiDbm} dBm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Cumulative TX:</span>
                  <span>{inspectedClient.txBytes} Bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Cumulative RX:</span>
                  <span>{inspectedClient.rxBytes} Bytes</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-800 block mb-1">Last Network Event:</span>
                <p className="text-slate-600 p-2.5 bg-slate-50 border border-slate-200 rounded">
                  {inspectedClient.lastEventDescription}
                </p>
              </div>

              {inspectedClient.failureReason && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded">
                  <span className="font-semibold block">Failure Cause:</span>
                  {inspectedClient.failureReason}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                {inspectedClient.status === 'CONNECTED' && (
                  <button
                    onClick={() => {
                      onDisconnectClient(inspectedClient.id);
                      setInspectedClient(null);
                    }}
                    className="px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium"
                  >
                    Disconnect Station
                  </button>
                )}
                <button
                  onClick={() => setInspectedClient(null)}
                  className="px-3.5 py-1.5 rounded bg-slate-900 text-white font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
