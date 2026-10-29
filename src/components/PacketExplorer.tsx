import React, { useState } from 'react';
import {
  Layers,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  FileCode,
  Radio,
  ArrowRight,
  Info,
} from 'lucide-react';
import { PacketCategory, PacketEvent, PacketType } from '../types/simulation';

interface PacketExplorerProps {
  packets: PacketEvent[];
  selectedPacketId: string | null;
  onSelectPacket: (id: string | null) => void;
  explanationMode: 'beginner' | 'engineering';
}

export const PacketExplorer: React.FC<PacketExplorerProps> = ({
  packets,
  selectedPacketId,
  onSelectPacket,
  explanationMode,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePacketModal, setActivePacketModal] = useState<PacketEvent | null>(null);

  const filteredPackets = packets.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.type.toLowerCase().includes(q) ||
        p.sourceName.toLowerCase().includes(q) ||
        p.destName.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryBadge = (cat: PacketCategory) => {
    switch (cat) {
      case 'WIFI_MANAGEMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">
            802.11 Mgmt
          </span>
        );
      case 'NETWORK_IP':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-50 text-sky-700 border border-sky-200">
            IPv4 / UDP / ICMP
          </span>
        );
      case 'APPLICATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            App Payload
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600">
            Link Layer
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Educational Banner: Frames vs Packets */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-900 block">
              Architectural Concept: 802.11 Wi-Fi Frames vs. IPv4 Network Packets
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>802.11 Management Frames</strong> (Beacons, Probes, Auth, Assoc) operate at the
              physical and link layer without IP addresses. In contrast, <strong>DHCP</strong> and{' '}
              <strong>ICMP Ping</strong> packets are Layer 3/4 network protocols encapsulated{' '}
              <em>inside</em> 802.11 QoS data frames. Notice how DHCP uses UDP ports 67/68 and IP
              broadcasts.
            </p>
          </div>
        </div>
      </div>

      {/* Packet Explorer Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 text-slate-800 rounded-md">
              <Layers className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Packet Explorer</h2>
              <p className="text-[11px] text-slate-500">
                Chronological network frame capture with layer-by-layer inspection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search type, IP, or summary..."
                className="pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 w-48 font-sans"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Layers</option>
              <option value="WIFI_MANAGEMENT">802.11 Management Frames</option>
              <option value="NETWORK_IP">IPv4 / DHCP / ICMP</option>
              <option value="APPLICATION">Application Data</option>
            </select>
          </div>
        </div>

        {/* Packet Records Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Protocol / Category</th>
                <th className="py-2.5 px-3">Message Type</th>
                <th className="py-2.5 px-3">Source &rarr; Destination</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-4">Summary Description</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No packet events recorded yet. Start the AP or connect a station to capture frames.
                  </td>
                </tr>
              ) : (
                filteredPackets.slice().reverse().map((pkt) => (
                  <tr
                    key={pkt.id}
                    onClick={() => setActivePacketModal(pkt)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      +{pkt.simTimestampMs} ms
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getCategoryBadge(pkt.category)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {pkt.type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap font-mono text-[11px]">
                      {pkt.sourceName} &rarr; {pkt.destName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {pkt.sizeBytes} B
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 truncate max-w-[280px]">
                      {pkt.summary}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePacketModal(pkt);
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Inspection Drawer Modal */}
      {activePacketModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActivePacketModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-slate-100 rounded-lg text-sky-600">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-mono">
                    {activePacketModal.type}
                  </h3>
                  {getCategoryBadge(activePacketModal.category)}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Timestamp: +{activePacketModal.simTimestampMs}ms &middot; Frame Size:{' '}
                  {activePacketModal.sizeBytes} bytes
                </p>
              </div>
            </div>

            {/* Explanation Level Display */}
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Summary
                </span>
                <p className="text-slate-800 font-medium">{activePacketModal.summary}</p>
                <p className="text-slate-600 text-[11px] leading-relaxed pt-1 border-t border-slate-200">
                  {explanationMode === 'beginner'
                    ? activePacketModal.beginnerExplanation
                    : activePacketModal.engineeringExplanation}
                </p>
              </div>

              {/* Protocol Stack / Encapsulation breakdown */}
              <div>
                <span className="font-semibold text-slate-800 block mb-2 text-[11px] uppercase tracking-wider">
                  Structured Protocol Header Layers
                </span>

                <div className="space-y-2 font-mono text-[11px]">
                  {/* Layer 2 */}
                  <div className="p-2.5 bg-purple-50/60 border border-purple-200 rounded text-purple-900">
                    <span className="font-bold block text-purple-800 mb-0.5">
                      Layer 2: Data Link / IEEE 802.11 MAC
                    </span>
                    <div>Frame Control: {activePacketModal.technicalDetails.frameControl || 'QoS Data Frame'}</div>
                    <div>Source MAC: {activePacketModal.sourceMacOrIp}</div>
                    <div>Destination MAC: {activePacketModal.destMacOrIp}</div>
                  </div>

                  {/* Layer 3 if present */}
                  {activePacketModal.technicalDetails.layer3 && (
                    <div className="p-2.5 bg-sky-50/60 border border-sky-200 rounded text-sky-900">
                      <span className="font-bold block text-sky-800 mb-0.5">
                        Layer 3: Network / IPv4
                      </span>
                      <div>{activePacketModal.technicalDetails.layer3}</div>
                    </div>
                  )}

                  {/* Layer 4 if present */}
                  {activePacketModal.technicalDetails.layer4 && (
                    <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-blue-900">
                      <span className="font-bold block text-blue-800 mb-0.5">
                        Layer 4: Transport / Protocol
                      </span>
                      <div>{activePacketModal.technicalDetails.layer4}</div>
                    </div>
                  )}

                  {/* Payload if present */}
                  {activePacketModal.technicalDetails.payloadSummary && (
                    <div className="p-2.5 bg-slate-100 border border-slate-200 rounded text-slate-800">
                      <span className="font-bold block text-slate-700 mb-0.5 font-sans">
                        Application Payload / Information Elements
                      </span>
                      <div className="font-mono text-slate-900">
                        {activePacketModal.technicalDetails.payloadSummary}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setActivePacketModal(null)}
                  className="px-4 py-1.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
