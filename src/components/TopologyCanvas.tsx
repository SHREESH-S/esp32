import React, { useState } from 'react';
import {
  Radio,
  Smartphone,
  Laptop,
  Tablet,
  Cpu,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Play,
  Square,
  RefreshCw,
  Send,
  Sliders,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ActivePacketAnimation,
  ApStatus,
  ClientDevice,
  DeviceType,
  NetworkConfiguration,
} from '../types/simulation';

interface TopologyCanvasProps {
  config: NetworkConfiguration;
  apStatus: ApStatus;
  apBssid: string;
  clients: ClientDevice[];
  selectedClientId: string | null;
  activePacketAnimation: ActivePacketAnimation | null;
  onSelectClient: (id: string | null) => void;
  onStartAp: () => void;
  onStopAp: () => void;
  onRestartAp: () => void;
  onConnectClient: (id: string) => void;
  onDisconnectClient: (id: string) => void;
  onAddNewClient: (name: string, type: DeviceType) => void;
  onRemoveClient: (id: string) => void;
  onOpenApConfig: () => void;
  onQuickPing: (id: string) => void;
  onQuickMessage: (id: string) => void;
  explanationMode: 'beginner' | 'engineering';
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  config,
  apStatus,
  apBssid,
  clients,
  selectedClientId,
  activePacketAnimation,
  onSelectClient,
  onStartAp,
  onStopAp,
  onRestartAp,
  onConnectClient,
  onDisconnectClient,
  onAddNewClient,
  onRemoveClient,
  onOpenApConfig,
  onQuickPing,
  onQuickMessage,
  explanationMode,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<DeviceType>('smartphone');

  // Canvas coordinates
  const canvasWidth = 860;
  const canvasHeight = 440;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2 - 10;

  // Calculate client node positions in a semi-circle / radial layout around ESP32
  const getClientPosition = (index: number, total: number) => {
    if (total === 1) return { x: centerX + 260, y: centerY };
    if (total === 2) {
      return index === 0
        ? { x: centerX - 240, y: centerY }
        : { x: centerX + 240, y: centerY };
    }
    // Radial distribution
    const angleStep = Math.PI / (total + 1);
    const startAngle = -Math.PI / 2 + Math.PI / (total + 1);
    const angle = (index - (total - 1) / 2) * (Math.PI / (total + 0.8));
    const radius = 250;
    return {
      x: centerX + Math.sin(angle) * radius,
      y: centerY + Math.cos(angle) * (radius * 0.75),
    };
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'smartphone':
        return <Smartphone className="w-4 h-4" />;
      case 'laptop':
        return <Laptop className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const isApActive = apStatus === 'RUNNING';

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    onAddNewClient(newClientName.trim(), newClientType);
    setNewClientName('');
    setShowAddModal(false);
  };

  const connectedCount = clients.filter((c) => c.status === 'CONNECTED').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Topology Toolbar */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            Network Topology Diagram
          </span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-500">
            Interactive IEEE 802.11 SoftAP &amp; Station Infrastructure
          </span>
        </div>

        {/* AP Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {apStatus === 'RUNNING' ? (
            <button
              onClick={onStopAp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium border border-rose-200 transition-colors shadow-2xs"
            >
              <Square className="w-3 h-3 text-rose-600 fill-rose-600" />
              Stop AP
            </button>
          ) : (
            <button
              onClick={onStartAp}
              disabled={apStatus === 'STARTING'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium transition-colors shadow-2xs"
            >
              <Play className="w-3 h-3 fill-white" />
              Start Access Point
            </button>
          )}

          <button
            onClick={onRestartAp}
            title="Restart SoftAP subsystem"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            Restart AP
          </button>

          <button
            onClick={onOpenApConfig}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
          >
            <Sliders className="w-3 h-3 text-slate-500" />
            AP Config
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Station
          </button>
        </div>
      </div>

      {/* SVG Canvas Workspace */}
      <div className="relative w-full overflow-x-auto bg-neutral-50/40 p-2 min-h-[460px] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="w-full max-w-[900px] h-auto select-none"
        >
          {/* Subtle Grid Background */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
            {/* SoftAP Radio Wave Pulse */}
            <radialGradient id="radioWave" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

          {/* Wi-Fi Beacon Waves when AP is Running */}
          {isApActive && (
            <g className="transition-opacity duration-500 opacity-100">
              <circle
                cx={centerX}
                cy={centerY}
                r="180"
                fill="url(#radioWave)"
                stroke="#bae6fd"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <circle
                cx={centerX}
                cy={centerY}
                r="120"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                opacity="0.6"
              />
              <circle
                cx={centerX}
                cy={centerY}
                r="65"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.4"
              />
            </g>
          )}

          {/* Connection Lines between ESP32 and Clients */}
          {clients.map((client, index) => {
            const pos = getClientPosition(index, clients.length);
            const isConnected = client.status === 'CONNECTED';
            const isConnecting =
              client.status === 'SCANNING' ||
              client.status === 'AUTHENTICATING' ||
              client.status === 'ASSOCIATING' ||
              client.status === 'REQUESTING_IP';
            const isSelected = selectedClientId === client.id;

            return (
              <g key={client.id}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={
                    isConnected
                      ? '#0284c7'
                      : isConnecting
                      ? '#f59e0b'
                      : '#cbd5e1'
                  }
                  strokeWidth={isConnected || isSelected ? '2' : '1.5'}
                  strokeDasharray={isConnected ? 'none' : '4 4'}
                  strokeOpacity={isConnected ? '0.8' : '0.6'}
                />

                {/* Animated transmission pulse dot if actively transferring */}
                {activePacketAnimation &&
                  ((activePacketAnimation.fromId === client.id && activePacketAnimation.toId === 'esp32') ||
                    (activePacketAnimation.fromId === 'esp32' && activePacketAnimation.toId === client.id)) && (
                    <g>
                      <circle
                        cx={(centerX + pos.x) / 2}
                        cy={(centerY + pos.y) / 2}
                        r="6"
                        fill="#0284c7"
                        className="animate-ping"
                      />
                      <circle
                        cx={(centerX + pos.x) / 2}
                        cy={(centerY + pos.y) / 2}
                        r="4"
                        fill="#0369a1"
                      />
                      {/* Packet type label pill on wire */}
                      <rect
                        x={(centerX + pos.x) / 2 - 38}
                        y={(centerY + pos.y) / 2 - 20}
                        width="76"
                        height="16"
                        rx="3"
                        fill="#0f172a"
                        opacity="0.9"
                      />
                      <text
                        x={(centerX + pos.x) / 2}
                        y={(centerY + pos.y) / 2 - 9}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {activePacketAnimation.packetType}
                      </text>
                    </g>
                  )}
              </g>
            );
          })}

          {/* CENTRAL NODE: ESP32 DEVKIT & SoftAP */}
          <g
            transform={`translate(${centerX - 95}, ${centerY - 75})`}
            className="cursor-pointer"
            onClick={() => onSelectClient(null)}
          >
            {/* Selection highlight */}
            {selectedClientId === null && (
              <rect
                x="-4"
                y="-4"
                width="198"
                height="158"
                rx="10"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}

            {/* ESP32 PCB Card Outline */}
            <rect
              x="0"
              y="0"
              width="190"
              height="150"
              rx="8"
              fill="#ffffff"
              stroke={isApActive ? '#0284c7' : '#94a3b8'}
              strokeWidth={isApActive ? '2' : '1.5'}
              className="shadow-md"
            />

            {/* ESP32 Top Antenna Trace representation */}
            <rect x="15" y="0" width="160" height="12" rx="2" fill="#0f172a" />
            <path
              d="M 25 6 L 40 6 L 40 10 L 55 10 L 55 6 L 70 6"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M 120 6 L 135 6 L 135 10 L 150 10 L 150 6 L 165 6"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Board Header Bar */}
            <rect x="0" y="12" width="190" height="24" fill="#f8fafc" />
            <line x1="0" y1="36" x2="190" y2="36" stroke="#e2e8f0" strokeWidth="1" />

            {/* ESP32 Chip Name */}
            <text
              x="12"
              y="28"
              fontSize="11"
              fontWeight="700"
              fill="#0f172a"
              fontFamily="sans-serif"
            >
              ESP32 DevKit (SoftAP)
            </text>

            {/* Status LED */}
            <circle
              cx="175"
              cy="24"
              r="4"
              fill={isApActive ? '#10b981' : apStatus === 'ERROR' ? '#ef4444' : '#94a3b8'}
            />

            {/* ESP-WROOM-32 Metal Can Badge */}
            <rect
              x="12"
              y="44"
              width="54"
              height="40"
              rx="3"
              fill="#e2e8f0"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <text x="39" y="60" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#334155">
              ESP-WROOM
            </text>
            <text x="39" y="70" textAnchor="middle" fontSize="6" fill="#64748b">
              2.4GHz Wi-Fi
            </text>
            <text x="39" y="78" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#0284c7">
              {config.security === 'OPEN' ? 'OPEN' : 'WPA2'}
            </text>

            {/* SoftAP Network Details */}
            <text x="74" y="55" fontSize="10" fontWeight="600" fill="#0f172a">
              {config.ssid}
            </text>
            <text x="74" y="68" fontSize="9" fontFamily="monospace" fill="#0369a1" fontWeight="500">
              IP: {config.apIp}
            </text>
            <text x="74" y="80" fontSize="8" fontFamily="monospace" fill="#64748b">
              MAC: {apBssid}
            </text>

            {/* Lower Info Line */}
            <line x1="10" y1="92" x2="180" y2="92" stroke="#f1f5f9" strokeWidth="1" />

            <text x="12" y="106" fontSize="8" fill="#64748b">
              CH: <tspan fontWeight="bold" fill="#0f172a">{config.channel}</tspan> &middot; DHCP:{' '}
              <tspan fontWeight="bold" fill={config.dhcpEnabled ? '#10b981' : '#f59e0b'}>
                {config.dhcpEnabled ? 'ON' : 'OFF'}
              </tspan>
            </text>

            <text x="12" y="120" fontSize="8" fill="#64748b">
              Stations:{' '}
              <tspan fontWeight="bold" fill={connectedCount >= config.maxClients ? '#ef4444' : '#0f172a'}>
                {connectedCount} / {config.maxClients}
              </tspan>
            </text>

            {/* Status indicator bar at bottom */}
            <rect
              x="0"
              y="136"
              width="190"
              height="14"
              rx="0 0 8 8"
              fill={
                isApActive
                  ? '#ecfdf5'
                  : apStatus === 'STARTING'
                  ? '#fffbeb'
                  : apStatus === 'ERROR'
                  ? '#fef2f2'
                  : '#f8fafc'
              }
            />
            <text
              x="95"
              y="146"
              textAnchor="middle"
              fontSize="8"
              fontWeight="600"
              fontFamily="monospace"
              fill={
                isApActive
                  ? '#059669'
                  : apStatus === 'STARTING'
                  ? '#d97706'
                  : apStatus === 'ERROR'
                  ? '#dc2626'
                  : '#64748b'
              }
            >
              {isApActive
                ? `● SOFTAP BROADCASTING (CH ${config.channel})`
                : apStatus === 'STARTING'
                ? '▲ INITIALIZING LWIP...'
                : apStatus === 'ERROR'
                ? '✕ CONFIGURATION ERROR'
                : '○ ACCESS POINT INACTIVE'}
            </text>
          </g>

          {/* CLIENT NODES */}
          {clients.map((client, index) => {
            const pos = getClientPosition(index, clients.length);
            const isSelected = selectedClientId === client.id;
            const isConnected = client.status === 'CONNECTED';
            const isFailed = client.status === 'FAILED';
            const isConnecting =
              client.status === 'SCANNING' ||
              client.status === 'AUTHENTICATING' ||
              client.status === 'ASSOCIATING' ||
              client.status === 'REQUESTING_IP';

            const nodeWidth = 148;
            const nodeHeight = 88;

            return (
              <g
                key={client.id}
                transform={`translate(${pos.x - nodeWidth / 2}, ${pos.y - nodeHeight / 2})`}
                className="cursor-pointer"
                onClick={() => onSelectClient(client.id)}
              >
                {/* Selected highlight border */}
                {isSelected && (
                  <rect
                    x="-4"
                    y="-4"
                    width={nodeWidth + 8}
                    height={nodeHeight + 8}
                    rx="8"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                  />
                )}

                {/* Client Node Box */}
                <rect
                  x="0"
                  y="0"
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="6"
                  fill="#ffffff"
                  stroke={
                    isConnected
                      ? '#10b981'
                      : isFailed
                      ? '#ef4444'
                      : isConnecting
                      ? '#f59e0b'
                      : '#cbd5e1'
                  }
                  strokeWidth={isConnected || isSelected ? '1.8' : '1'}
                  className="shadow-xs hover:shadow-sm transition-shadow"
                />

                {/* Device Header */}
                <rect x="0" y="0" width={nodeWidth} height="20" rx="6 6 0 0" fill="#f8fafc" />
                <line x1="0" y1="20" x2={nodeWidth} y2="20" stroke="#f1f5f9" strokeWidth="1" />

                <text x="8" y="14" fontSize="9" fontWeight="700" fill="#0f172a">
                  {client.name}
                </text>

                {/* Signal RSSI badge */}
                <text x={nodeWidth - 8} y="14" textAnchor="end" fontSize="8" fontFamily="monospace" fill="#64748b">
                  {client.rssiDbm} dBm
                </text>

                {/* Status indicator line */}
                <g transform="translate(8, 28)">
                  <circle
                    cx="4"
                    cy="4"
                    r="3.5"
                    fill={
                      isConnected
                        ? '#10b981'
                        : isFailed
                        ? '#ef4444'
                        : isConnecting
                        ? '#f59e0b'
                        : '#94a3b8'
                    }
                  />
                  <text
                    x="12"
                    y="7"
                    fontSize="8.5"
                    fontWeight="600"
                    fill={
                      isConnected
                        ? '#059669'
                        : isFailed
                        ? '#dc2626'
                        : isConnecting
                        ? '#d97706'
                        : '#64748b'
                    }
                  >
                    {client.status}
                  </text>
                </g>

                {/* Assigned IP */}
                <text x="8" y="52" fontSize="9" fontFamily="monospace" fontWeight="600" fill="#0f172a">
                  {client.assignedIp ? (
                    `IP: ${client.assignedIp}`
                  ) : (
                    <tspan fill="#94a3b8">IP: [No IPv4 Assigned]</tspan>
                  )}
                </text>

                {/* MAC Address */}
                <text x="8" y="66" fontSize="7.5" fontFamily="monospace" fill="#64748b">
                  MAC: {client.macAddress}
                </text>

                {/* Traffic summary */}
                <text x="8" y="79" fontSize="7" fontFamily="monospace" fill="#94a3b8">
                  TX: {client.txBytes}B | RX: {client.rxBytes}B
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Quick Action Overlay when a node is selected */}
        {selectedClientId && (
          <div className="absolute bottom-3 left-4 right-4 sm:left-auto sm:right-4 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2.5 shadow-md flex items-center justify-between gap-3 text-xs z-10">
            {(() => {
              const client = clients.find((c) => c.id === selectedClientId);
              if (!client) return null;
              const isConn = client.status === 'CONNECTED';
              return (
                <div className="flex items-center justify-between w-full gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{client.name}:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        isConn
                          ? 'bg-emerald-50 text-emerald-700'
                          : client.status === 'FAILED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {client.status}
                    </span>
                    {client.assignedIp && (
                      <span className="font-mono text-[11px] text-slate-600">
                        {client.assignedIp}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isConn ? (
                      <>
                        <button
                          onClick={() => onQuickPing(client.id)}
                          className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-medium transition-colors"
                        >
                          Ping AP
                        </button>
                        <button
                          onClick={() => onQuickMessage(client.id)}
                          className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-medium transition-colors"
                        >
                          Send Message
                        </button>
                        <button
                          onClick={() => onDisconnectClient(client.id)}
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium transition-colors"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onConnectClient(client.id)}
                        disabled={apStatus !== 'RUNNING'}
                        title={apStatus !== 'RUNNING' ? 'Start AP before connecting' : ''}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium transition-colors"
                      >
                        Connect to AP
                      </button>
                    )}

                    {clients.length > 1 && (
                      <button
                        onClick={() => onRemoveClient(client.id)}
                        title="Delete client device"
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Educational Explanation Box beneath Topology */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          {explanationMode === 'beginner' ? (
            <p>
              <strong className="text-slate-800">Beginner Guide:</strong> The ESP32 is creating a
              wireless Wi-Fi network like a home hotspot. Click on any device to connect it, or click
              "Start Access Point" if the network is off. All communication stays inside your
              browser simulation.
            </p>
          ) : (
            <p>
              <strong className="text-slate-800">Engineering Protocol:</strong> The ESP32 SoftAP
              transmits 802.11 Beacon management frames every {config.beaconIntervalMs}ms TU. Station
              nodes initiate 802.11 Active Scanning (Probe Request/Response) &rarr; Open System Auth
              &rarr; 802.11 Association (AID) &rarr; lwIP DHCP DORA transaction over UDP port 67/68.
            </p>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-slate-200 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Add Simulated Wi-Fi Station</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a new station node to test multi-client associations and DHCP lease allocation.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Device Name</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. ESP32-CAM, iPad Pro, IoT Thermostat"
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Device Type</label>
                <select
                  value={newClientType}
                  onChange={(e) => setNewClientType(e.target.value as DeviceType)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                >
                  <option value="smartphone">Smartphone</option>
                  <option value="laptop">Laptop</option>
                  <option value="tablet">Tablet</option>
                  <option value="iot_device">IoT Microcontroller</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
                >
                  Add Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
