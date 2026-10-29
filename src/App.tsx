import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TopologyCanvas } from './components/TopologyCanvas';
import { ApConfigPanel } from './components/ApConfigPanel';
import { ClientControlPanel } from './components/ClientControlPanel';
import { DataCommunicator } from './components/DataCommunicator';
import { NetworkInspector } from './components/NetworkInspector';
import { PacketExplorer } from './components/PacketExplorer';
import { SerialMonitor } from './components/SerialMonitor';
import { FirmwareView } from './components/FirmwareView';
import { LearningGuideView } from './components/LearningGuideView';
import { ExperimentsView } from './components/ExperimentsView';
import { TestRunnerModal } from './components/TestRunnerModal';
import {
  SimulationState,
  NetworkConfiguration,
  ClientDevice,
  DeviceType,
} from './types/simulation';
import {
  createInitialState,
  startApSequence,
  advanceApStartupStage,
  stopAccessPoint,
  startClientConnection,
  advanceClientScan,
  advanceClientAuth,
  advanceClientAssoc,
  advanceClientIp,
  disconnectClient,
  sendPing,
  sendApplicationMessage,
  addNewClient,
  removeClient,
} from './engine/simulationEngine';
import { GuidedExperiment } from './data/guidedExperiments';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [simState, setSimState] = useState<SimulationState>(createInitialState());
  const [activeTab, setActiveTab] = useState<string>('lab');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  // References for asynchronous timers and stepping
  const simStateRef = useRef(simState);
  simStateRef.current = simState;

  // 1. Simulation Master Clock
  useEffect(() => {
    if (!simState.isClockRunning) return;

    const interval = setInterval(() => {
      setSimState((prev) => ({
        ...prev,
        simClockMs: prev.simClockMs + 50 * prev.clockSpeed,
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [simState.isClockRunning, simState.clockSpeed]);

  // 2. AP Startup Sequence Runner (Stages 1 through 8)
  useEffect(() => {
    if (simState.apStatus !== 'STARTING') return;

    const currentStage = simState.apStartupStage;
    if (currentStage >= 8) return;

    const delay = Math.max(80, 220 / simState.clockSpeed);
    const timer = setTimeout(() => {
      setSimState((prev) => advanceApStartupStage(prev, currentStage + 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [simState.apStatus, simState.apStartupStage, simState.clockSpeed]);

  // 3. Client Connection FSM Progression Runner
  useEffect(() => {
    const clientsToAdvance = simState.clients.filter(
      (c) =>
        c.status === 'SCANNING' ||
        c.status === 'NETWORK_FOUND' ||
        c.status === 'AUTHENTICATING' ||
        c.status === 'ASSOCIATING'
    );

    if (clientsToAdvance.length === 0) return;

    const targetClient = clientsToAdvance[0];
    const delay = Math.max(90, 280 / simState.clockSpeed);

    const timer = setTimeout(() => {
      setSimState((prev) => {
        const client = prev.clients.find((c) => c.id === targetClient.id);
        if (!client) return prev;

        switch (client.status) {
          case 'SCANNING':
            return advanceClientScan(prev, client.id);
          case 'NETWORK_FOUND':
            return advanceClientAuth(prev, client.id);
          case 'AUTHENTICATING':
            return advanceClientAssoc(prev, client.id);
          case 'ASSOCIATING':
            return advanceClientIp(prev, client.id);
          default:
            return prev;
        }
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [simState.clients, simState.clockSpeed]);

  // 4. Packet Animation Progress Decay
  useEffect(() => {
    if (!simState.activePacketAnimation) return;

    const timer = setTimeout(() => {
      setSimState((prev) => ({
        ...prev,
        activePacketAnimation: null,
      }));
    }, 1200 / simState.clockSpeed);

    return () => clearTimeout(timer);
  }, [simState.activePacketAnimation, simState.clockSpeed]);

  // -------------------------------------------------------------
  // Simulation Handlers
  // -------------------------------------------------------------

  const handleStartAp = () => {
    setSimState((prev) => startApSequence(prev));
  };

  const handleStopAp = () => {
    setSimState((prev) => stopAccessPoint(prev));
  };

  const handleRestartAp = () => {
    setSimState((prev) => {
      const stopped = stopAccessPoint(prev);
      return startApSequence(stopped);
    });
  };

  const handleConnectClient = (clientId: string) => {
    setSimState((prev) => startClientConnection(prev, clientId));
  };

  const handleDisconnectClient = (clientId: string) => {
    setSimState((prev) => disconnectClient(prev, clientId));
  };

  const handleSendPing = (clientId: string) => {
    setSimState((prev) => sendPing(prev, clientId));
  };

  const handleSendMessage = (clientId: string, msg: string, bytes?: number) => {
    setSimState((prev) => sendApplicationMessage(prev, clientId, msg, bytes));
  };

  const handleAddNewClient = (name: string, type: DeviceType) => {
    setSimState((prev) => addNewClient(prev, name, type));
  };

  const handleRemoveClient = (clientId: string) => {
    setSimState((prev) => removeClient(prev, clientId));
  };

  const handleUpdateConfig = (newConfig: NetworkConfiguration) => {
    setSimState((prev) => ({
      ...prev,
      config: newConfig,
    }));
  };

  const handleUpdateClient = (updated: ClientDevice) => {
    setSimState((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === updated.id ? updated : c)),
    }));
  };

  const handleClearLogs = () => {
    setSimState((prev) => ({
      ...prev,
      serialLogs: [],
    }));
  };

  const handleConfirmReset = () => {
    setSimState(createInitialState());
    setShowResetConfirm(false);
  };

  // Guided Experiment Setup and Auto-Run
  const handleSetupExperiment = (exp: GuidedExperiment) => {
    let s = createInitialState();
    if (exp.setupPreset) {
      if (exp.setupPreset.ssid) s.config.ssid = exp.setupPreset.ssid;
      if (exp.setupPreset.password) s.config.password = exp.setupPreset.password;
      if (exp.setupPreset.maxClients) s.config.maxClients = exp.setupPreset.maxClients;
      if (exp.setupPreset.dhcpEnabled !== undefined) s.config.dhcpEnabled = exp.setupPreset.dhcpEnabled;
      if (exp.setupPreset.apIp) s.config.apIp = exp.setupPreset.apIp;
      if (exp.setupPreset.security) s.config.security = exp.setupPreset.security;

      if (exp.setupPreset.clientAction === 'wrong_pass') {
        s.clients[0].inputPassword = 'invalid_password_999';
      }

      if (exp.setupPreset.apRunning) {
        s = startApSequence(s);
        for (let i = 2; i <= 8; i++) {
          s = advanceApStartupStage(s, i);
        }
      }
    }
    setSimState(s);
    setActiveTab('lab');
  };

  const handleRunAutoExperiment = (exp: GuidedExperiment) => {
    handleSetupExperiment(exp);

    setTimeout(() => {
      // Step through action according to experiment ID
      if (exp.id === 1) {
        setSimState((prev) => startApSequence(prev));
      } else if (exp.id === 2 || exp.id === 4 || exp.id === 5 || exp.id === 7 || exp.id === 8) {
        setSimState((prev) => startClientConnection(prev, 'client-phone'));
      } else if (exp.id === 3 || exp.id === 6) {
        // Multi-client connect
        setSimState((prev) => {
          let s = startClientConnection(prev, 'client-phone');
          s = advanceClientScan(s, 'client-phone');
          s = advanceClientAuth(s, 'client-phone');
          s = advanceClientAssoc(s, 'client-phone');
          s = advanceClientIp(s, 'client-phone');
          return startClientConnection(s, 'client-laptop');
        });
      } else if (exp.id === 9) {
        setSimState((prev) => {
          let s = startClientConnection(prev, 'client-phone');
          s = advanceClientScan(s, 'client-phone');
          s = advanceClientAuth(s, 'client-phone');
          s = advanceClientAssoc(s, 'client-phone');
          s = advanceClientIp(s, 'client-phone');
          return sendApplicationMessage(s, 'client-phone', 'HELLO ESP32');
        });
      } else if (exp.id === 10) {
        setSimState((prev) => {
          let s = startClientConnection(prev, 'client-phone');
          s = advanceClientScan(s, 'client-phone');
          s = advanceClientAuth(s, 'client-phone');
          s = advanceClientAssoc(s, 'client-phone');
          s = advanceClientIp(s, 'client-phone');
          s = sendApplicationMessage(s, 'client-phone', 'STREAMING PAYLOAD...', 1024);
          return stopAccessPoint(s);
        });
      } else if (exp.id === 12) {
        setSimState((prev) => {
          let s = startClientConnection(prev, 'client-phone');
          s = advanceClientScan(s, 'client-phone');
          s = advanceClientAuth(s, 'client-phone');
          s = advanceClientAssoc(s, 'client-phone');
          s = advanceClientIp(s, 'client-phone');
          return disconnectClient(s, 'client-phone');
        });
      }
    }, 400);
  };

  const selectedClient = simState.clients.find((c) => c.id === simState.selectedClientId);
  const connectedCount = simState.clients.filter((c) => c.status === 'CONNECTED').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        apStatus={simState.apStatus}
        apStartupStage={simState.apStartupStage}
        connectedClientsCount={connectedCount}
        maxClients={simState.config.maxClients}
        simClockMs={simState.simClockMs}
        isClockRunning={simState.isClockRunning}
        clockSpeed={simState.clockSpeed}
        explanationMode={simState.explanationMode}
        onToggleClock={() =>
          setSimState((prev) => ({ ...prev, isClockRunning: !prev.isClockRunning }))
        }
        onSetSpeed={(speed) => setSimState((prev) => ({ ...prev, clockSpeed: speed }))}
        onToggleExplanationMode={() =>
          setSimState((prev) => ({
            ...prev,
            explanationMode: prev.explanationMode === 'beginner' ? 'engineering' : 'beginner',
          }))
        }
        onRequestReset={() => {
          if (simState.apStatus === 'RUNNING' || connectedCount > 0) {
            setShowResetConfirm(true);
          } else {
            handleConfirmReset();
          }
        }}
        onOpenTests={() => setShowTestModal(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TAB 1: SIMULATION LAB */}
        {activeTab === 'lab' && (
          <div className="space-y-6">
            {/* Top Interactive Topology Canvas */}
            <TopologyCanvas
              config={simState.config}
              apStatus={simState.apStatus}
              apBssid={simState.apBssid}
              clients={simState.clients}
              selectedClientId={simState.selectedClientId}
              activePacketAnimation={simState.activePacketAnimation}
              onSelectClient={(id) => setSimState((prev) => ({ ...prev, selectedClientId: id }))}
              onStartAp={handleStartAp}
              onStopAp={handleStopAp}
              onRestartAp={handleRestartAp}
              onConnectClient={handleConnectClient}
              onDisconnectClient={handleDisconnectClient}
              onAddNewClient={handleAddNewClient}
              onRemoveClient={handleRemoveClient}
              onOpenApConfig={() => setShowConfigModal(true)}
              onQuickPing={handleSendPing}
              onQuickMessage={(id) => handleSendMessage(id, 'HELLO ESP32')}
              explanationMode={simState.explanationMode}
            />

            {/* Split Panel: Client Station Controls + Data Communicator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedClient ? (
                <ClientControlPanel
                  client={selectedClient}
                  isApRunning={simState.apStatus === 'RUNNING'}
                  onUpdateClient={handleUpdateClient}
                  onConnect={() => handleConnectClient(selectedClient.id)}
                  onDisconnect={() => handleDisconnectClient(selectedClient.id)}
                  onDelete={() => handleRemoveClient(selectedClient.id)}
                  onPing={() => handleSendPing(selectedClient.id)}
                  onSendMessage={() => handleSendMessage(selectedClient.id, 'HELLO ESP32')}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
                  <p className="text-sm font-semibold text-slate-800 mb-1">No Station Selected</p>
                  <p className="text-xs text-slate-500 max-w-xs mb-3">
                    Click any client device node in the topology diagram above to inspect and control it.
                  </p>
                  <button
                    onClick={() =>
                      setSimState((prev) => ({
                        ...prev,
                        selectedClientId: prev.clients[0]?.id || null,
                      }))
                    }
                    className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                  >
                    Select First Station
                  </button>
                </div>
              )}

              <DataCommunicator
                clients={simState.clients}
                selectedClientId={simState.selectedClientId}
                transfers={simState.dataTransfers}
                isApRunning={simState.apStatus === 'RUNNING'}
                onSendPing={handleSendPing}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        )}

        {/* TAB 2: NETWORK INSPECTOR */}
        {activeTab === 'inspector' && (
          <NetworkInspector
            config={simState.config}
            apStatus={simState.apStatus}
            apBssid={simState.apBssid}
            clients={simState.clients}
            dhcpLeases={simState.dhcpLeases}
            simClockMs={simState.simClockMs}
            onSelectClient={(id) => {
              setSimState((prev) => ({ ...prev, selectedClientId: id }));
              setActiveTab('lab');
            }}
            onDisconnectClient={handleDisconnectClient}
          />
        )}

        {/* TAB 3: PACKET EXPLORER */}
        {activeTab === 'packets' && (
          <PacketExplorer
            packets={simState.packets}
            selectedPacketId={simState.selectedPacketId}
            onSelectPacket={(id) => setSimState((prev) => ({ ...prev, selectedPacketId: id }))}
            explanationMode={simState.explanationMode}
          />
        )}

        {/* TAB 4: SERIAL MONITOR */}
        {activeTab === 'serial' && (
          <SerialMonitor logs={simState.serialLogs} onClearLogs={handleClearLogs} />
        )}

        {/* TAB 5: FIRMWARE */}
        {activeTab === 'firmware' && <FirmwareView config={simState.config} />}

        {/* TAB 6: LEARNING GUIDE */}
        {activeTab === 'guide' && (
          <LearningGuideView
            onGoToLab={() => setActiveTab('lab')}
            explanationMode={simState.explanationMode}
          />
        )}

        {/* TAB 7: GUIDED EXPERIMENTS */}
        {activeTab === 'experiments' && (
          <ExperimentsView
            onSetupExperiment={handleSetupExperiment}
            onRunAutoExperiment={handleRunAutoExperiment}
            onGoToLab={() => setActiveTab('lab')}
          />
        )}
      </main>

      {/* AP Configuration Modal (Accessible from anywhere) */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="max-w-2xl w-full my-8">
            <div className="relative">
              <ApConfigPanel
                config={simState.config}
                isApRunning={simState.apStatus === 'RUNNING'}
                onUpdateConfig={(cfg) => {
                  handleUpdateConfig(cfg);
                  setShowConfigModal(false);
                }}
                onRestartAp={() => {
                  handleRestartAp();
                  setShowConfigModal(false);
                }}
              />
              <button
                onClick={() => setShowConfigModal(false)}
                className="absolute top-4 right-4 text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Reset Active Simulation?
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Resetting will stop the SoftAP, terminate all station associations, clear DHCP leases,
              and wipe the packet logs back to default initial state.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14 Unit Tests Modal */}
      <TestRunnerModal isOpen={showTestModal} onClose={() => setShowTestModal(false)} />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 font-mono">
        ESP32 Wi-Fi SoftAP Educational Virtual Laboratory &middot; In-Browser Software Simulation (Not Physical Radio HW)
      </footer>
    </div>
  );
}
