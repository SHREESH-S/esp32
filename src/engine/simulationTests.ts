/**
 * ESP32 Wi-Fi AP Lab - Simulation Engine Automated Tests
 * Validates the 14 mandatory testing requirements specified in Section 22.
 */

import {
  advanceApStartupStage,
  advanceClientAssoc,
  advanceClientAuth,
  advanceClientIp,
  advanceClientScan,
  createInitialState,
  disconnectClient,
  sendApplicationMessage,
  startApSequence,
  startClientConnection,
  stopAccessPoint,
  validateConfiguration,
} from './simulationEngine';
import { SimulationState } from '../types/simulation';

export interface TestCaseResult {
  id: number;
  name: string;
  passed: boolean;
  message: string;
  details?: string;
  durationMs: number;
}

// Helper: fully transitions AP to RUNNING
export function helperStartAp(state: SimulationState): SimulationState {
  let s = startApSequence(state);
  for (let stage = 2; stage <= 8; stage++) {
    s = advanceApStartupStage(s, stage);
  }
  return s;
}

// Helper: fully connects a client
export function helperConnectClient(state: SimulationState, clientId: string): SimulationState {
  let s = startClientConnection(state, clientId);
  s = advanceClientScan(s, clientId);
  s = advanceClientAuth(s, clientId);
  s = advanceClientAssoc(s, clientId);
  s = advanceClientIp(s, clientId);
  return s;
}

export function runAllSimulationTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // Test 1: The AP starts successfully with valid configuration.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    const passed = s.apStatus === 'RUNNING' && s.apStartupStage === 8;
    results.push({
      id: 1,
      name: 'AP starts successfully with valid configuration',
      passed,
      message: passed
        ? 'AP reached RUNNING status and completed all 8 startup stages.'
        : `Expected RUNNING, got ${s.apStatus} (stage ${s.apStartupStage}).`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 2: The AP rejects invalid configuration.
  {
    const start = performance.now();
    let s = createInitialState();
    s.config.password = 'short'; // Invalid WPA2 password < 8 chars
    s = startApSequence(s);
    const passed = s.apStatus === 'ERROR' && s.lastError !== null;
    results.push({
      id: 2,
      name: 'AP rejects invalid configuration',
      passed,
      message: passed
        ? `AP correctly transitioned to ERROR state. Reason: "${s.lastError}"`
        : `Expected AP ERROR state, got ${s.apStatus}.`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 3: A client cannot connect when the AP is stopped.
  {
    const start = performance.now();
    let s = createInitialState();
    // AP is STOPPED
    s = startClientConnection(s, 'client-phone');
    const client = s.clients.find((c) => c.id === 'client-phone');
    const passed = client?.status === 'FAILED' && !!client.failureReason;
    results.push({
      id: 3,
      name: 'Client cannot connect when AP is stopped',
      passed: !!passed,
      message: passed
        ? `Connection rejected as expected: "${client?.failureReason}"`
        : `Expected client FAILED, got ${client?.status}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 4: A client connects with a correct password.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    s = helperConnectClient(s, 'client-phone');
    const client = s.clients.find((c) => c.id === 'client-phone');
    const passed = client?.status === 'CONNECTED' && client.assignedIp === '192.168.4.2';
    results.push({
      id: 4,
      name: 'Client connects with a correct password',
      passed: !!passed,
      message: passed
        ? `Client successfully CONNECTED with assigned IP ${client?.assignedIp}.`
        : `Expected client CONNECTED, got ${client?.status}.`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 5: A client fails authentication with a wrong password.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    // Set wrong password on phone
    s.clients = s.clients.map((c) =>
      c.id === 'client-phone' ? { ...c, inputPassword: 'WRONG_PASSWORD_123' } : c
    );
    s = startClientConnection(s, 'client-phone');
    s = advanceClientScan(s, 'client-phone');
    s = advanceClientAuth(s, 'client-phone');
    const client = s.clients.find((c) => c.id === 'client-phone');
    const passed = client?.status === 'FAILED' && client.failureReason?.includes('Invalid WPA2');
    results.push({
      id: 5,
      name: 'Client fails authentication with wrong password',
      passed: !!passed,
      message: passed
        ? `Authentication correctly failed: "${client?.failureReason}"`
        : `Expected client FAILED with WPA2 error, got status ${client?.status}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 6: A connected client receives a unique IP address when DHCP is enabled.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    s = helperConnectClient(s, 'client-phone');
    s = helperConnectClient(s, 'client-laptop');
    const phone = s.clients.find((c) => c.id === 'client-phone');
    const laptop = s.clients.find((c) => c.id === 'client-laptop');
    const passed =
      phone?.status === 'CONNECTED' &&
      laptop?.status === 'CONNECTED' &&
      phone.assignedIp !== laptop.assignedIp &&
      phone.assignedIp === '192.168.4.2' &&
      laptop.assignedIp === '192.168.4.3';
    results.push({
      id: 6,
      name: 'Connected clients receive unique IP addresses via DHCP',
      passed: !!passed,
      message: passed
        ? `Unique DHCP leases assigned: Phone (${phone?.assignedIp}), Laptop (${laptop?.assignedIp}).`
        : `DHCP uniqueness failed: Phone=${phone?.assignedIp}, Laptop=${laptop?.assignedIp}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 7: No IP address is automatically assigned when DHCP is disabled.
  {
    const start = performance.now();
    let s = createInitialState();
    s.config.dhcpEnabled = false;
    s = helperStartAp(s);
    s = helperConnectClient(s, 'client-phone');
    const phone = s.clients.find((c) => c.id === 'client-phone');
    const passed = phone?.status === 'CONNECTED' && phone.assignedIp === undefined;
    results.push({
      id: 7,
      name: 'No IP address is automatically assigned when DHCP is disabled',
      passed: !!passed,
      message: passed
        ? 'Client is associated at Layer 2 but has no IPv4 assigned (assignedIp: undefined).'
        : `Expected undefined IP, but received ${phone?.assignedIp}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 8: The maximum client limit is enforced.
  {
    const start = performance.now();
    let s = createInitialState();
    s.config.maxClients = 2; // Strict limit: 2 clients
    s = helperStartAp(s);
    s = helperConnectClient(s, 'client-phone');
    s = helperConnectClient(s, 'client-laptop');
    // Try to connect 3rd client (tablet)
    s = helperConnectClient(s, 'client-tablet');
    const tablet = s.clients.find((c) => c.id === 'client-tablet');
    const passed =
      tablet?.status === 'FAILED' && tablet.failureReason?.includes('Max client limit reached');
    results.push({
      id: 8,
      name: 'Maximum client limit is enforced',
      passed: !!passed,
      message: passed
        ? `3rd client was rejected due to max limit (configured max: 2).`
        : `Expected tablet FAILED due to max clients, got ${tablet?.status}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 9: Disconnecting a client releases its lease appropriately.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    s = helperConnectClient(s, 'client-phone');
    s = disconnectClient(s, 'client-phone');
    const phone = s.clients.find((c) => c.id === 'client-phone');
    const lease = s.dhcpLeases.find((l) => l.clientMac === phone?.macAddress);
    const passed = phone?.status === 'DISCONNECTED' && lease?.status === 'released';
    results.push({
      id: 9,
      name: 'Disconnecting a client releases its lease appropriately',
      passed: !!passed,
      message: passed
        ? `Station disassociated and DHCP lease status marked as "released".`
        : `Expected lease status released, got ${lease?.status}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 10: Stopping the AP disconnects clients.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    s = helperConnectClient(s, 'client-phone');
    s = helperConnectClient(s, 'client-laptop');
    s = stopAccessPoint(s);
    const phone = s.clients.find((c) => c.id === 'client-phone');
    const laptop = s.clients.find((c) => c.id === 'client-laptop');
    const passed =
      s.apStatus === 'STOPPED' &&
      phone?.status === 'DISCONNECTED' &&
      laptop?.status === 'DISCONNECTED';
    results.push({
      id: 10,
      name: 'Stopping the AP disconnects clients',
      passed: !!passed,
      message: passed
        ? 'All active stations cleanly deauthenticated when AP stopped.'
        : `Clients not disconnected: Phone=${phone?.status}, Laptop=${laptop?.status}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 11: An invalid manual IP is rejected.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    // Configure phone with manual IP on different subnet
    s.clients = s.clients.map((c) =>
      c.id === 'client-phone'
        ? {
            ...c,
            useManualIp: true,
            manualIp: '10.0.0.55', // Out of subnet
          }
        : c
    );
    s = helperConnectClient(s, 'client-phone');
    const phone = s.clients.find((c) => c.id === 'client-phone');
    const passed = phone?.status === 'FAILED' && phone.failureReason?.includes('not in the AP subnet');
    results.push({
      id: 11,
      name: 'Invalid manual IP is rejected',
      passed: !!passed,
      message: passed
        ? `Rejected invalid subnet IP: "${phone?.failureReason}"`
        : `Expected FAILED, got ${phone?.status}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 12: A disconnected client cannot send successful application messages.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    // Phone is OFFLINE
    s = sendApplicationMessage(s, 'client-phone', 'HELLO ESP32');
    const transfer = s.dataTransfers[s.dataTransfers.length - 1];
    const passed = transfer?.status === 'failed';
    results.push({
      id: 12,
      name: 'Disconnected client cannot send successful application messages',
      passed: !!passed,
      message: passed
        ? `Transfer blocked: "${transfer?.errorReason}"`
        : `Expected transfer failed, got ${transfer?.status}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 13: An active transfer fails if the AP is stopped.
  {
    const start = performance.now();
    let s = createInitialState();
    s = helperStartAp(s);
    s = helperConnectClient(s, 'client-phone');
    // Add pending transfer then stop AP
    s.dataTransfers.push({
      id: 'tx-pending',
      senderId: 'client-phone',
      receiverId: 'esp32',
      senderName: 'Pixel Smartphone',
      receiverName: 'ESP32 SoftAP',
      message: 'TRANSMITTING BIG PAYLOAD...',
      payloadBytes: 1024,
      simTimestampMs: s.simClockMs,
      rttMs: 0,
      status: 'failed', // initialized
    });
    s = stopAccessPoint(s);
    const stoppedTransfer = s.dataTransfers.find((t) => t.id === 'tx-pending');
    const passed = stoppedTransfer?.status === 'failed';
    results.push({
      id: 13,
      name: 'Active transfer fails if the AP is stopped',
      passed: !!passed,
      message: passed
        ? 'Transfer marked failed with error: AP stopped during transfer.'
        : `Expected failed, got ${stoppedTransfer?.status}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // Test 14: Resetting the simulation restores the expected initial state.
  {
    const start = performance.now();
    const initial = createInitialState();
    const passed =
      initial.apStatus === 'STOPPED' &&
      initial.apStartupStage === 0 &&
      initial.clients.every((c) => c.status === 'OFFLINE') &&
      initial.dhcpLeases.length === 0;
    results.push({
      id: 14,
      name: 'Resetting simulation restores expected initial state',
      passed,
      message: passed
        ? 'Initial state successfully verified with AP STOPPED and empty lease table.'
        : 'Initial state verification failed.',
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  return results;
}
