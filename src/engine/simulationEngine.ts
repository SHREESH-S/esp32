/**
 * ESP32 Wi-Fi AP Lab - Core Simulation Engine
 * Deterministic finite state machines for SoftAP, DHCP server, client stations, and packet generator.
 */

import {
  ApStatus,
  ClientDevice,
  ClientStatus,
  DataTransfer,
  DeviceType,
  DhcpLease,
  NetworkConfiguration,
  PacketEvent,
  PacketType,
  SerialLogEntry,
  SimulationState,
  ValidationResult,
} from '../types/simulation';

export const DEFAULT_CONFIG: NetworkConfiguration = {
  ssid: 'ESP32_LAB_AP',
  password: 'esp32lab123',
  apIp: '192.168.4.1',
  subnetMask: '255.255.255.0',
  channel: 1,
  maxClients: 4,
  security: 'WPA2_PSK',
  dhcpEnabled: true,
  beaconIntervalMs: 100,
};

export const INITIAL_CLIENTS: ClientDevice[] = [
  {
    id: 'client-phone',
    name: 'Pixel Smartphone',
    type: 'smartphone',
    macAddress: '3C:06:30:4A:88:12',
    status: 'OFFLINE',
    targetSsid: 'ESP32_LAB_AP',
    inputPassword: 'esp32lab123',
    useManualIp: false,
    rssiDbm: -52,
    txBytes: 0,
    rxBytes: 0,
    lastEventDescription: 'Device powered on, Wi-Fi radio idle.',
  },
  {
    id: 'client-laptop',
    name: 'ThinkPad Laptop',
    type: 'laptop',
    macAddress: 'F0:D5:BF:19:E2:44',
    status: 'OFFLINE',
    targetSsid: 'ESP32_LAB_AP',
    inputPassword: 'esp32lab123',
    useManualIp: false,
    rssiDbm: -48,
    txBytes: 0,
    rxBytes: 0,
    lastEventDescription: 'Device powered on, Wi-Fi radio idle.',
  },
  {
    id: 'client-tablet',
    name: 'iPad Pro Tablet',
    type: 'tablet',
    macAddress: '88:66:5A:CC:20:9B',
    status: 'OFFLINE',
    targetSsid: 'ESP32_LAB_AP',
    inputPassword: 'esp32lab123',
    useManualIp: false,
    rssiDbm: -64,
    txBytes: 0,
    rxBytes: 0,
    lastEventDescription: 'Device powered on, Wi-Fi radio idle.',
  },
];

export const ESP32_BSSID = '24:6F:28:B1:C3:90';

export function createInitialState(): SimulationState {
  return {
    config: { ...DEFAULT_CONFIG },
    apStatus: 'STOPPED',
    apStartupStage: 0,
    apBssid: ESP32_BSSID,
    clients: INITIAL_CLIENTS.map((c) => ({ ...c })),
    selectedClientId: 'client-phone',
    selectedPacketId: null,
    activePacketAnimation: null,
    dhcpLeases: [],
    packets: [],
    serialLogs: [
      {
        id: 'boot-0',
        simTimestampMs: 0,
        text: 'ESP32 Bootloader v4.4 - CPU0 240MHz, RAM 520KB',
        level: 'info',
      },
      {
        id: 'boot-1',
        simTimestampMs: 10,
        text: 'Firmware: ESP32 SoftAP Interactive Simulation v1.0',
        level: 'info',
      },
      {
        id: 'boot-2',
        simTimestampMs: 20,
        text: 'Wi-Fi subsystem initialized. Awaiting user start command.',
        level: 'info',
      },
    ],
    dataTransfers: [],
    simClockMs: 0,
    isClockRunning: true,
    clockSpeed: 1,
    explanationMode: 'engineering',
    lastError: null,
  };
}

// -------------------------------------------------------------
// Validation Logic
// -------------------------------------------------------------

export function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

export function validateConfiguration(config: NetworkConfiguration): ValidationResult {
  const errors: Record<string, string> = {};

  if (!config.ssid || config.ssid.length < 1 || config.ssid.length > 32) {
    errors.ssid = 'SSID must be between 1 and 32 characters.';
  }

  if (config.security === 'WPA2_PSK') {
    if (!config.password || config.password.length < 8 || config.password.length > 63) {
      errors.password = 'WPA2-PSK requires a pre-shared key of 8 to 63 ASCII characters.';
    }
  }

  if (!isValidIpv4(config.apIp)) {
    errors.apIp = 'Invalid IPv4 address format for SoftAP IP.';
  }

  if (!isValidIpv4(config.subnetMask)) {
    errors.subnetMask = 'Invalid IPv4 address format for Subnet Mask.';
  }

  if (config.channel < 1 || config.channel > 13) {
    errors.channel = 'Wi-Fi 2.4GHz channels must be within 1 to 13.';
  }

  if (config.maxClients < 1 || config.maxClients > 8) {
    errors.maxClients = 'ESP32 SoftAP supports 1 to 8 concurrent stations (default: 4).';
  }

  if (config.beaconIntervalMs < 50 || config.beaconIntervalMs > 1000) {
    errors.beaconIntervalMs = 'Beacon interval must be between 50ms and 1000ms.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Check if IP is in the same /24 subnet as AP
export function isSameSubnet(ip: string, apIp: string, subnetMask: string = '255.255.255.0'): boolean {
  if (!isValidIpv4(ip) || !isValidIpv4(apIp)) return false;
  const ipParts = ip.split('.').map(Number);
  const apParts = apIp.split('.').map(Number);
  const maskParts = subnetMask.split('.').map(Number);

  for (let i = 0; i < 4; i++) {
    if ((ipParts[i] & maskParts[i]) !== (apParts[i] & maskParts[i])) {
      return false;
    }
  }
  return true;
}

// -------------------------------------------------------------
// Packet Factory
// -------------------------------------------------------------

let packetSequenceCounter = 1;

export function createPacket(
  simTimestampMs: number,
  type: PacketType,
  sourceName: string,
  sourceMacOrIp: string,
  destName: string,
  destMacOrIp: string,
  customSummary?: string,
  payloadSummary?: string
): PacketEvent {
  const seq = packetSequenceCounter++;
  const id = `pkt-${Date.now()}-${seq}`;

  switch (type) {
    case 'BEACON':
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 128,
        summary: customSummary || `802.11 Beacon frame broadcast (SSID, supported rates)`,
        technicalDetails: {
          layer2: 'IEEE 802.11 Management (Subtype 0x08 - Beacon)',
          frameControl: 'Type: Management (00), Subtype: Beacon (1000)',
          sequenceNumber: seq,
          payloadSummary: payloadSummary || `BSSID: ${sourceMacOrIp}, Interval: 100 TU, Capabilities: ESS, Privacy`,
        },
        beginnerExplanation: 'The ESP32 announces to everyone nearby: "I am a Wi-Fi network called ESP32_LAB_AP!"',
        engineeringExplanation: 'Periodic 802.11 Beacon management frame transmitted at DTIM interval to advertise BSSID, SSID, channel capability, and RSN/WPA2 information elements.',
      };

    case 'PROBE_REQ':
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 74,
        summary: customSummary || `Probe Request: Scanning for broadcast/target SSID`,
        technicalDetails: {
          layer2: 'IEEE 802.11 Management (Subtype 0x04 - Probe Request)',
          frameControl: 'Type: Management (00), Subtype: Probe Request (0100)',
          sequenceNumber: seq,
          payloadSummary: payloadSummary || `Wildcard SSID or targeted SSID query`,
        },
        beginnerExplanation: 'The client device turns on its Wi-Fi antenna and asks: "Who is broadcasting Wi-Fi networks right now?"',
        engineeringExplanation: 'Active scan 802.11 management probe request transmitted to broadcast BSSID (ff:ff:ff:ff:ff:ff) across 2.4GHz channels.',
      };

    case 'PROBE_RESP':
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 134,
        summary: customSummary || `Probe Response: AP advertises parameters to client`,
        technicalDetails: {
          layer2: 'IEEE 802.11 Management (Subtype 0x05 - Probe Response)',
          frameControl: 'Type: Management (00), Subtype: Probe Response (0101)',
          sequenceNumber: seq,
          payloadSummary: payloadSummary || `Matched SSID, supported HT20 data rates, WPA2-PSK cipher suites`,
        },
        beginnerExplanation: 'The ESP32 hears the client and answers: "I am here! My name is ESP32_LAB_AP and I use WPA2 security."',
        engineeringExplanation: 'Directed 802.11 Probe Response unicast to station MAC containing supported rates, channel DS parameter set, and RSN element.',
      };

    case 'AUTH_REQ':
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 44,
        summary: customSummary || `Authentication Request (Open System, Seq 1)`,
        technicalDetails: {
          layer2: 'IEEE 802.11 Management (Subtype 0x0B - Authentication)',
          frameControl: 'Type: Management (00), Subtype: Auth (1011)',
          sequenceNumber: seq,
          payloadSummary: payloadSummary || `Auth Algorithm: Open System (0), Auth Transaction Seq: 1`,
        },
        beginnerExplanation: 'The client knocks on the ESP32 door: "Please begin authentication so I can join."',
        engineeringExplanation: 'Station initiates 802.11 link-layer Open System Authentication transaction seq 1 before four-way WPA2 handshake.',
      };

    case 'AUTH_RESP':
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 44,
        summary: customSummary || `Authentication Response`,
        technicalDetails: {
          layer2: 'IEEE 802.11 Management (Subtype 0x0B - Authentication)',
          frameControl: 'Type: Management (00), Subtype: Auth (1011)',
          sequenceNumber: seq,
          payloadSummary: payloadSummary || `Auth Algorithm: Open System, Auth Transaction Seq: 2`,
        },
        beginnerExplanation: 'The ESP32 verifies credentials and confirms whether authentication passed or failed.',
        engineeringExplanation: 'SoftAP returns 802.11 Auth Response. Status 0 denotes successful link-layer authorization; non-zero denotes authentication failure.',
      };

    case 'ASSOC_REQ':
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 86,
        summary: customSummary || `Association Request: Station requests network membership`,
        technicalDetails: {
          layer2: 'IEEE 802.11 Management (Subtype 0x00 - Association Request)',
          frameControl: 'Type: Management (00), Subtype: Assoc Req (0000)',
          sequenceNumber: seq,
          payloadSummary: payloadSummary || `Capabilities: Short Preamble, ESS; Listen Interval: 10`,
        },
        beginnerExplanation: 'The client requests: "Please register me as an active member of your wireless network."',
        engineeringExplanation: 'Station requests formal 802.11 association to allocate state resources and link client MAC to AP association table.',
      };

    case 'ASSOC_RESP':
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 52,
        summary: customSummary || `Association Response: AP assigns Association ID (AID)`,
        technicalDetails: {
          layer2: 'IEEE 802.11 Management (Subtype 0x01 - Association Response)',
          frameControl: 'Type: Management (00), Subtype: Assoc Resp (0001)',
          sequenceNumber: seq,
          payloadSummary: payloadSummary || `Status: Success (0x0000), Association ID: AID #${seq % 8 + 1}`,
        },
        beginnerExplanation: 'The ESP32 agrees: "Association accepted! You are now connected to the wireless layer."',
        engineeringExplanation: 'AP updates station table, assigns AID (Association ID), and grants layer-2 wireless connection.',
      };

    case 'DHCP_DISCOVER':
      return {
        id,
        simTimestampMs,
        category: 'NETWORK_IP',
        type,
        sourceName,
        sourceMacOrIp: '0.0.0.0',
        destName: 'Broadcast (All)',
        destMacOrIp: '255.255.255.255',
        sizeBytes: 342,
        summary: `DHCP Discover: Client broadcasts request for an IPv4 address`,
        technicalDetails: {
          layer2: 'Ethernet II encapsulated in 802.11 Data frame',
          layer3: 'IPv4: Src 0.0.0.0 -> Dst 255.255.255.255 (Broadcast)',
          layer4: 'UDP: Src Port 68 (BootPC) -> Dst Port 67 (BootPS)',
          payloadSummary: 'DHCP Message Type 1 (Discover), Client MAC: ' + sourceMacOrIp,
        },
        beginnerExplanation: 'The client does not have an IP address yet, so it shouts across the network: "Is there a DHCP server that can give me an IP address?"',
        engineeringExplanation: 'Layer 3 broadcast UDP datagram requesting IPv4 configuration parameters from local DHCP service daemon.',
      };

    case 'DHCP_OFFER':
      return {
        id,
        simTimestampMs,
        category: 'NETWORK_IP',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 342,
        summary: customSummary || `DHCP Offer: AP proposes IP address`,
        technicalDetails: {
          layer2: 'Ethernet II encapsulated in 802.11 Data frame',
          layer3: `IPv4: Src ${sourceMacOrIp} -> Dst ${destMacOrIp}`,
          layer4: 'UDP: Src Port 67 (BootPS) -> Dst Port 68 (BootPC)',
          payloadSummary: payloadSummary || 'DHCP Message Type 2 (Offer), Proposed lease time 7200s',
        },
        beginnerExplanation: 'The ESP32 responds: "Yes, I am the DHCP server! I can offer you IP address 192.168.4.2."',
        engineeringExplanation: 'DHCP daemon reserves an IP from pool and offers lease duration, subnet mask, and default gateway.',
      };

    case 'DHCP_REQUEST':
      return {
        id,
        simTimestampMs,
        category: 'NETWORK_IP',
        type,
        sourceName,
        sourceMacOrIp: '0.0.0.0',
        destName: 'Broadcast (AP)',
        destMacOrIp: '255.255.255.255',
        sizeBytes: 342,
        summary: customSummary || `DHCP Request: Client requests offered IP address`,
        technicalDetails: {
          layer2: 'Ethernet II encapsulated in 802.11 Data frame',
          layer3: 'IPv4: Src 0.0.0.0 -> Dst 255.255.255.255',
          layer4: 'UDP: Src Port 68 (BootPC) -> Dst Port 67 (BootPS)',
          payloadSummary: payloadSummary || 'DHCP Message Type 3 (Request), Requested IP committed',
        },
        beginnerExplanation: 'The client says: "Great! I formally request and accept that IP address."',
        engineeringExplanation: 'Station broadcasts DHCPREQUEST with Requested IP Address option, verifying acceptance of the offered parameters.',
      };

    case 'DHCP_ACK':
      return {
        id,
        simTimestampMs,
        category: 'NETWORK_IP',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 342,
        summary: customSummary || `DHCP ACK: AP confirms IP lease assignment`,
        technicalDetails: {
          layer2: 'Ethernet II encapsulated in 802.11 Data frame',
          layer3: `IPv4: Src ${sourceMacOrIp} -> Dst ${destMacOrIp}`,
          layer4: 'UDP: Src Port 67 (BootPS) -> Dst Port 68 (BootPC)',
          payloadSummary: payloadSummary || 'DHCP Message Type 5 (ACK), Subnet: 255.255.255.0, Gateway: ' + sourceMacOrIp,
        },
        beginnerExplanation: 'The ESP32 confirms: "All set! You may now use this IP address to send and receive data."',
        engineeringExplanation: 'SoftAP DHCP service commits lease to memory table and transmits DHCPACK to complete IPv4 autoconfiguration.',
      };

    case 'ICMP_ECHO_REQ':
      return {
        id,
        simTimestampMs,
        category: 'NETWORK_IP',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 64,
        summary: `ICMP Echo Request (Ping) from ${sourceName} to ${destName}`,
        technicalDetails: {
          layer2: 'Ethernet II in 802.11 QoS Data',
          layer3: `IPv4: Src ${sourceMacOrIp} -> Dst ${destMacOrIp}, TTL=64, Protocol=ICMP (1)`,
          layer4: 'ICMP: Type 8 (Echo Request), Code 0, Checksum 0x4f12',
          payloadSummary: payloadSummary || 'Payload: 32 bytes ASCII test pattern [abcdefghijklmnopqrstuvw]',
        },
        beginnerExplanation: 'The client sends a "ping" to check if the ESP32 is listening and measures the reaction time.',
        engineeringExplanation: 'Standard ICMP Type 8 Echo Request to test layer-3 IP reachability across the SoftAP wireless link.',
      };

    case 'ICMP_ECHO_REPLY':
      return {
        id,
        simTimestampMs,
        category: 'NETWORK_IP',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 64,
        summary: `ICMP Echo Reply (Pong) from ${sourceName} to ${destName}`,
        technicalDetails: {
          layer2: 'Ethernet II in 802.11 QoS Data',
          layer3: `IPv4: Src ${sourceMacOrIp} -> Dst ${destMacOrIp}, TTL=128, Protocol=ICMP (1)`,
          layer4: 'ICMP: Type 0 (Echo Reply), Code 0, Checksum 0x5712',
          payloadSummary: payloadSummary || 'Echoed matching 32-byte test pattern',
        },
        beginnerExplanation: 'The ESP32 responds: "I am here and running normally!"',
        engineeringExplanation: 'ESP32 lwIP stack processes ICMP Type 8 and generates ICMP Type 0 Echo Reply with identical sequence identifier.',
      };

    case 'APP_DATA_REQ':
      return {
        id,
        simTimestampMs,
        category: 'APPLICATION',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 80,
        summary: customSummary || `Application Data Request`,
        technicalDetails: {
          layer2: '802.11 QoS Data frame',
          layer3: `IPv4: Src ${sourceMacOrIp} -> Dst ${destMacOrIp}`,
          layer4: 'TCP/UDP Port 80 / 8080 Application endpoint',
          payloadSummary: payloadSummary || 'Data payload',
        },
        beginnerExplanation: 'Client sends an actual text or command message to the ESP32.',
        engineeringExplanation: 'Application layer payload encapsulated inside transport datagram over ESP32 lwIP network interface.',
      };

    case 'APP_DATA_RESP':
      return {
        id,
        simTimestampMs,
        category: 'APPLICATION',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 96,
        summary: customSummary || `Application Data Response`,
        technicalDetails: {
          layer2: '802.11 QoS Data frame',
          layer3: `IPv4: Src ${sourceMacOrIp} -> Dst ${destMacOrIp}`,
          layer4: 'TCP/UDP Port 80 / 8080 Response',
          payloadSummary: payloadSummary || 'Response payload',
        },
        beginnerExplanation: 'ESP32 processes the message in its firmware and replies back to the client.',
        engineeringExplanation: 'ESP32 Arduino sketch handles incoming socket buffer and writes response packet back to station.',
      };

    case 'DISASSOC':
    case 'DEAUTH':
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 38,
        summary: customSummary || `802.11 Disassociation / Deauthentication frame`,
        technicalDetails: {
          layer2: `IEEE 802.11 Management (${type === 'DEAUTH' ? 'Subtype 0x0C - Deauth' : 'Subtype 0x0A - Disassoc'})`,
          frameControl: 'Type: Management',
          sequenceNumber: seq,
          payloadSummary: payloadSummary || 'Reason Code 3 (Deauthenticated because sending station is leaving BSS)',
        },
        beginnerExplanation: 'The client or ESP32 cleanly closes the wireless connection.',
        engineeringExplanation: '802.11 management frame terminating association table entry and freeing allocated transceiver state.',
      };

    default:
      return {
        id,
        simTimestampMs,
        category: 'WIFI_MANAGEMENT',
        type,
        sourceName,
        sourceMacOrIp,
        destName,
        destMacOrIp,
        sizeBytes: 60,
        summary: customSummary || `802.11 Network Event: ${type}`,
        technicalDetails: { layer2: 'IEEE 802.11' },
        beginnerExplanation: 'Network communication event.',
        engineeringExplanation: '802.11 link event occurred.',
      };
  }
}

// -------------------------------------------------------------
// Pure Reducer Actions & Transitions
// -------------------------------------------------------------

export function startApSequence(state: SimulationState): SimulationState {
  // Validate configuration first
  const validation = validateConfiguration(state.config);
  if (!validation.valid) {
    const errorMsg = Object.values(validation.errors)[0] || 'Invalid configuration';
    return {
      ...state,
      apStatus: 'ERROR',
      apStartupStage: 1,
      lastError: errorMsg,
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-err`,
          simTimestampMs: state.simClockMs,
          text: `[ERROR] Configuration check failed: ${errorMsg}`,
          level: 'error',
        },
      ],
    };
  }

  // AP transitions to STARTING
  return {
    ...state,
    apStatus: 'STARTING',
    apStartupStage: 1,
    lastError: null,
    serialLogs: [
      ...state.serialLogs,
      {
        id: `log-${Date.now()}-1`,
        simTimestampMs: state.simClockMs,
        text: 'Starting ESP32 Wi-Fi AP simulation...',
        level: 'info',
      },
      {
        id: `log-${Date.now()}-2`,
        simTimestampMs: state.simClockMs + 10,
        text: `Configuration validated (SSID: "${state.config.ssid}", Sec: ${state.config.security})`,
        level: 'info',
      },
    ],
  };
}

export function advanceApStartupStage(state: SimulationState, nextStage: number): SimulationState {
  if (state.apStatus !== 'STARTING') return state;

  const logs: SerialLogEntry[] = [...state.serialLogs];
  let newStatus: ApStatus = 'STARTING';
  const newPackets: PacketEvent[] = [...state.packets];

  const now = state.simClockMs;

  switch (nextStage) {
    case 2:
      logs.push({
        id: `log-${Date.now()}-s2`,
        simTimestampMs: now,
        text: '[0020 ms] Wi-Fi driver initialized (esp_wifi_init)',
        level: 'info',
      });
      break;
    case 3:
      logs.push({
        id: `log-${Date.now()}-s3`,
        simTimestampMs: now,
        text: '[0030 ms] WiFi.mode(WIFI_AP) configured',
        level: 'info',
      });
      break;
    case 4:
      logs.push({
        id: `log-${Date.now()}-s4`,
        simTimestampMs: now,
        text: `[0040 ms] WiFi.softAPConfig(${state.config.apIp}, ${state.config.apIp}, ${state.config.subnetMask})`,
        level: 'info',
      });
      break;
    case 5:
      logs.push({
        id: `log-${Date.now()}-s5`,
        simTimestampMs: now,
        text: `[0050 ms] WiFi.softAP("${state.config.ssid}", password, ch=${state.config.channel}, max=${state.config.maxClients})`,
        level: 'info',
      });
      break;
    case 6:
      logs.push({
        id: `log-${Date.now()}-s6`,
        simTimestampMs: now,
        text: `[0060 ms] Access point started successfully! IP: ${state.config.apIp}`,
        level: 'info',
      });
      break;
    case 7:
      logs.push({
        id: `log-${Date.now()}-s7`,
        simTimestampMs: now,
        text: `[0070 ms] 802.11 Beacon frame broadcast active (${state.config.beaconIntervalMs}ms TU)`,
        level: 'info',
      });
      // Initial beacon packet
      newPackets.push(
        createPacket(
          now,
          'BEACON',
          'ESP32 SoftAP',
          state.apBssid,
          'Broadcast',
          'FF:FF:FF:FF:FF:FF',
          `Beacon broadcast: SSID "${state.config.ssid}", Ch ${state.config.channel}, ${state.config.security}`
        )
      );
      break;
    case 8:
      logs.push({
        id: `log-${Date.now()}-s8`,
        simTimestampMs: now,
        text: `[0080 ms] DHCP server: ${state.config.dhcpEnabled ? 'ENABLED (pool: 192.168.4.2..)' : 'DISABLED'}`,
        level: 'info',
      });
      newStatus = 'RUNNING';
      break;
  }

  return {
    ...state,
    apStatus: newStatus,
    apStartupStage: nextStage,
    serialLogs: logs,
    packets: newPackets,
  };
}

export function stopAccessPoint(state: SimulationState): SimulationState {
  if (state.apStatus === 'STOPPED') return state;

  const now = state.simClockMs;
  const newPackets = [...state.packets];
  const newLogs: SerialLogEntry[] = [
    ...state.serialLogs,
    {
      id: `log-${Date.now()}-stop`,
      simTimestampMs: now,
      text: 'WiFi.softAPdisconnect(true) -> SoftAP stopped. Disconnecting all stations.',
      level: 'warn',
    },
  ];

  // Disconnect all connected/connecting clients
  const updatedClients = state.clients.map((client) => {
    if (client.status !== 'OFFLINE' && client.status !== 'DISCONNECTED') {
      newPackets.push(
        createPacket(
          now,
          'DEAUTH',
          'ESP32 SoftAP',
          state.apBssid,
          client.name,
          client.macAddress,
          `Deauth frame sent to ${client.name} (Reason: AP shutting down)`
        )
      );
      return {
        ...client,
        status: 'DISCONNECTED' as ClientStatus,
        assignedIp: undefined,
        failureReason: 'Access point stopped by operator.',
        lastEventDescription: 'Disconnected because the AP shut down.',
      };
    }
    return client;
  });

  // Mark all DHCP leases as released
  const updatedLeases = state.dhcpLeases.map((lease) => ({
    ...lease,
    status: 'released' as const,
  }));

  // Cancel any active transfers
  const updatedTransfers = state.dataTransfers.map((t) => {
    if (t.status === 'success') return t;
    return {
      ...t,
      status: 'failed' as const,
      errorReason: 'AP stopped during transfer.',
    };
  });

  return {
    ...state,
    apStatus: 'STOPPED',
    apStartupStage: 0,
    clients: updatedClients,
    dhcpLeases: updatedLeases,
    dataTransfers: updatedTransfers,
    packets: newPackets,
    serialLogs: newLogs,
    activePacketAnimation: null,
  };
}

// -------------------------------------------------------------
// Client Connection State Machine Steps
// -------------------------------------------------------------

export function startClientConnection(state: SimulationState, clientId: string): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) return state;

  // Rule: AP must be running
  if (state.apStatus !== 'RUNNING') {
    return {
      ...state,
      clients: state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: 'FAILED',
              failureReason: 'Cannot connect: ESP32 Access Point is not running.',
              lastEventDescription: 'Connection failed: Wi-Fi radio found no active SoftAP.',
            }
          : c
      ),
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-ap-down`,
          simTimestampMs: state.simClockMs,
          text: `[WARN] Station [${client.macAddress}] connection attempt rejected: AP is not active.`,
          level: 'warn',
        },
      ],
    };
  }

  // Begin scanning
  const now = state.simClockMs;
  const newPacket = createPacket(
    now,
    'PROBE_REQ',
    client.name,
    client.macAddress,
    'Broadcast',
    'FF:FF:FF:FF:FF:FF',
    `${client.name} sending active Probe Request scanning for SSID "${client.targetSsid}"`
  );

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            status: 'SCANNING',
            failureReason: undefined,
            lastEventDescription: `Scanning 2.4GHz channels for SSID "${c.targetSsid}"...`,
          }
        : c
    ),
    packets: [...state.packets, newPacket],
    activePacketAnimation: {
      id: `anim-${Date.now()}`,
      fromId: clientId,
      toId: 'esp32',
      label: 'Probe Request',
      packetType: 'PROBE_REQ',
      category: 'WIFI_MANAGEMENT',
      progress: 0,
    },
  };
}

export function advanceClientScan(state: SimulationState, clientId: string): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client || client.status !== 'SCANNING') return state;

  const now = state.simClockMs;

  // Check SSID match
  if (client.targetSsid !== state.config.ssid) {
    return {
      ...state,
      clients: state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: 'FAILED',
              failureReason: `SSID mismatch: scanned for "${client.targetSsid}" but AP broadcasts "${state.config.ssid}"`,
              lastEventDescription: 'Scan finished: target SSID not found in beacon cache.',
            }
          : c
      ),
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-ssid-mismatch`,
          simTimestampMs: now,
          text: `[WARN] Client ${client.name} searched for unknown SSID "${client.targetSsid}"`,
          level: 'warn',
        },
      ],
      activePacketAnimation: null,
    };
  }

  // AP responds with Probe Response
  const respPacket = createPacket(
    now,
    'PROBE_RESP',
    'ESP32 SoftAP',
    state.apBssid,
    client.name,
    client.macAddress,
    `Probe Response from ESP32 SoftAP: SSID "${state.config.ssid}", BSSID ${state.apBssid}`
  );

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            status: 'NETWORK_FOUND',
            lastEventDescription: `Discovered BSSID ${state.apBssid} with RSSI ${c.rssiDbm} dBm. Ready for auth.`,
          }
        : c
    ),
    packets: [...state.packets, respPacket],
    activePacketAnimation: {
      id: `anim-${Date.now()}`,
      fromId: 'esp32',
      toId: clientId,
      label: 'Probe Response',
      packetType: 'PROBE_RESP',
      category: 'WIFI_MANAGEMENT',
      progress: 0,
    },
  };
}

export function advanceClientAuth(state: SimulationState, clientId: string): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client || client.status !== 'NETWORK_FOUND') return state;

  const now = state.simClockMs;
  const authReq = createPacket(
    now,
    'AUTH_REQ',
    client.name,
    client.macAddress,
    'ESP32 SoftAP',
    state.apBssid,
    `${client.name} initiates 802.11 Open System Authentication`
  );

  // Validate security credentials
  if (state.config.security === 'WPA2_PSK') {
    if (client.inputPassword !== state.config.password) {
      const authFailResp = createPacket(
        now + 10,
        'AUTH_RESP',
        'ESP32 SoftAP',
        state.apBssid,
        client.name,
        client.macAddress,
        `Authentication Failed: Status code 1 (Invalid WPA2 pre-shared key)`
      );
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                status: 'FAILED',
                failureReason: 'Authentication failed: Invalid WPA2 password.',
                lastEventDescription: '4-way handshake failed: Pre-shared key does not match.',
              }
            : c
        ),
        packets: [...state.packets, authReq, authFailResp],
        serialLogs: [
          ...state.serialLogs,
          {
            id: `log-${Date.now()}-auth-fail`,
            simTimestampMs: now + 10,
            text: `[WARN] Station [${client.macAddress}] authentication failure: WPA2 key mismatch`,
            level: 'warn',
          },
        ],
        activePacketAnimation: null,
      };
    }
  }

  // Auth successful
  const authSuccessResp = createPacket(
    now + 10,
    'AUTH_RESP',
    'ESP32 SoftAP',
    state.apBssid,
    client.name,
    client.macAddress,
    `Authentication Succeeded: Status code 0 (Accepted)`
  );

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            status: 'AUTHENTICATING',
            lastEventDescription: '802.11 Authentication succeeded. Proceeding to Association.',
          }
        : c
    ),
    packets: [...state.packets, authReq, authSuccessResp],
    activePacketAnimation: {
      id: `anim-${Date.now()}`,
      fromId: clientId,
      toId: 'esp32',
      label: 'Auth Handshake',
      packetType: 'AUTH_REQ',
      category: 'WIFI_MANAGEMENT',
      progress: 0,
    },
  };
}

export function advanceClientAssoc(state: SimulationState, clientId: string): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client || client.status !== 'AUTHENTICATING') return state;

  const now = state.simClockMs;
  const assocReq = createPacket(
    now,
    'ASSOC_REQ',
    client.name,
    client.macAddress,
    'ESP32 SoftAP',
    state.apBssid,
    `${client.name} requests 802.11 Association to BSSID ${state.apBssid}`
  );

  // Check max client limit
  const activeClients = state.clients.filter(
    (c) => c.status === 'ASSOCIATING' || c.status === 'REQUESTING_IP' || c.status === 'CONNECTED'
  );

  if (activeClients.length >= state.config.maxClients) {
    const assocDeny = createPacket(
      now + 10,
      'ASSOC_RESP',
      'ESP32 SoftAP',
      state.apBssid,
      client.name,
      client.macAddress,
      `Association Denied: Status code 17 (AP unable to handle additional associated stations)`
    );
    return {
      ...state,
      clients: state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: 'FAILED',
              failureReason: `Max client limit reached (${state.config.maxClients} max stations configured).`,
              lastEventDescription: `Association rejected: ESP32 SoftAP station table full (${activeClients.length}/${state.config.maxClients}).`,
            }
          : c
      ),
      packets: [...state.packets, assocReq, assocDeny],
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-max-client`,
          simTimestampMs: now + 10,
          text: `[ERROR] Association rejected for [${client.macAddress}]: max_connection limit (${state.config.maxClients}) reached`,
          level: 'error',
        },
      ],
      activePacketAnimation: null,
    };
  }

  // Association accepted
  const aid = activeClients.length + 1;
  const assocResp = createPacket(
    now + 10,
    'ASSOC_RESP',
    'ESP32 SoftAP',
    state.apBssid,
    client.name,
    client.macAddress,
    `Association Successful: Status code 0 (Success), Assigned AID #${aid}`
  );

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            status: 'ASSOCIATING',
            lastEventDescription: `Associated at Layer 2 (AID #${aid}). Ready for IP assignment.`,
          }
        : c
    ),
    packets: [...state.packets, assocReq, assocResp],
    serialLogs: [
      ...state.serialLogs,
      {
        id: `log-${Date.now()}-assoc`,
        simTimestampMs: now + 10,
        text: `[INFO] Station [${client.macAddress}] associated with SoftAP (AID: ${aid})`,
        level: 'info',
      },
    ],
    activePacketAnimation: {
      id: `anim-${Date.now()}`,
      fromId: 'esp32',
      toId: clientId,
      label: 'Assoc Response (AID ' + aid + ')',
      packetType: 'ASSOC_RESP',
      category: 'WIFI_MANAGEMENT',
      progress: 0,
    },
  };
}

export function advanceClientIp(state: SimulationState, clientId: string): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client || client.status !== 'ASSOCIATING') return state;

  const now = state.simClockMs;

  // Case A: Manual Static IP Configuration
  if (client.useManualIp) {
    const targetIp = client.manualIp?.trim() || '';
    if (!isValidIpv4(targetIp)) {
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                status: 'FAILED',
                failureReason: `Invalid static IPv4 address: "${targetIp}"`,
                lastEventDescription: 'Static IP assignment failed: invalid IPv4 format.',
              }
            : c
        ),
      };
    }

    // Check subnet compatibility
    if (!isSameSubnet(targetIp, state.config.apIp, state.config.subnetMask)) {
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                status: 'FAILED',
                failureReason: `Static IP ${targetIp} is not in the AP subnet (${state.config.apIp} / ${state.config.subnetMask}).`,
                lastEventDescription: 'Subnet mismatch error: host unreachable.',
              }
            : c
        ),
      };
    }

    // Check clash with AP or other clients
    if (targetIp === state.config.apIp) {
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                status: 'FAILED',
                failureReason: `IP address collision: ${targetIp} is already assigned to the ESP32 SoftAP gateway.`,
                lastEventDescription: 'ARP conflict detected: duplicate IP on network.',
              }
            : c
        ),
      };
    }

    const collision = state.clients.find((c) => c.id !== clientId && c.assignedIp === targetIp);
    if (collision) {
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                status: 'FAILED',
                failureReason: `IP address collision: ${targetIp} is already held by station ${collision.name}.`,
                lastEventDescription: 'ARP conflict: duplicate IP address in use.',
              }
            : c
        ),
      };
    }

    // Manual IP succeeds
    return {
      ...state,
      clients: state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: 'CONNECTED',
              assignedIp: targetIp,
              assignedGateway: state.config.apIp,
              assignedSubnet: state.config.subnetMask,
              connectedAtSimMs: now,
              lastEventDescription: `Connected with Static IP: ${targetIp}.`,
            }
          : c
      ),
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-static-ip`,
          simTimestampMs: now,
          text: `[INFO] Station [${client.macAddress}] joined with static IP ${targetIp}`,
          level: 'info',
        },
      ],
      activePacketAnimation: null,
    };
  }

  // Case B: DHCP is DISABLED on AP
  if (!state.config.dhcpEnabled) {
    // Client stays associated at layer 2, but has NO IP address
    return {
      ...state,
      clients: state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: 'CONNECTED',
              assignedIp: undefined, // No IPv4 assigned
              assignedGateway: undefined,
              assignedSubnet: undefined,
              connectedAtSimMs: now,
              lastEventDescription: 'Associated at Wi-Fi layer (L2), but DHCP is disabled on AP. No IP assigned (0.0.0.0).',
            }
          : c
      ),
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-no-dhcp`,
          simTimestampMs: now,
          text: `[WARN] Station [${client.macAddress}] associated, but DHCP server is disabled. Station has no IPv4 lease.`,
          level: 'warn',
        },
      ],
      activePacketAnimation: null,
    };
  }

  // Case C: DHCP is ENABLED - Run full DORA sequence
  // Find next available IP in pool (e.g. 192.168.4.2 -> 192.168.4.8)
  const apIpParts = state.config.apIp.split('.').map(Number);
  const baseSubnet = `${apIpParts[0]}.${apIpParts[1]}.${apIpParts[2]}`;
  const usedIps = new Set(
    state.clients
      .filter((c) => c.status === 'CONNECTED' && c.assignedIp)
      .map((c) => c.assignedIp as string)
  );
  usedIps.add(state.config.apIp);

  let allocatedIp: string | null = null;
  for (let host = 2; host <= 1 + state.config.maxClients; host++) {
    const candidate = `${baseSubnet}.${host}`;
    if (!usedIps.has(candidate)) {
      allocatedIp = candidate;
      break;
    }
  }

  if (!allocatedIp) {
    return {
      ...state,
      clients: state.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: 'FAILED',
              failureReason: 'DHCP Pool Exhausted: No available IPv4 addresses in configured pool.',
              lastEventDescription: 'DHCP NAK: pool exhausted.',
            }
          : c
      ),
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-dhcp-exhausted`,
          simTimestampMs: now,
          text: `[ERROR] DHCP lease failed for [${client.macAddress}]: IP pool exhausted`,
          level: 'error',
        },
      ],
      activePacketAnimation: null,
    };
  }

  // DORA Packets
  const pDiscover = createPacket(now, 'DHCP_DISCOVER', client.name, client.macAddress, 'Broadcast', '255.255.255.255');
  const pOffer = createPacket(
    now + 10,
    'DHCP_OFFER',
    'ESP32 DHCP',
    state.config.apIp,
    client.name,
    allocatedIp,
    `DHCP Offer: AP proposes IP ${allocatedIp} to ${client.name}`,
    `Offered IP: ${allocatedIp}, Gateway: ${state.config.apIp}, Netmask: ${state.config.subnetMask}, Lease: 7200s`
  );
  const pRequest = createPacket(
    now + 20,
    'DHCP_REQUEST',
    client.name,
    '0.0.0.0',
    'Broadcast',
    '255.255.255.255',
    `DHCP Request: Client requests offered IP ${allocatedIp}`,
    `Requested IP: ${allocatedIp}, Server Identifier: ${state.config.apIp}`
  );
  const pAck = createPacket(
    now + 30,
    'DHCP_ACK',
    'ESP32 DHCP',
    state.config.apIp,
    client.name,
    allocatedIp,
    `DHCP ACK: AP confirms lease of IP ${allocatedIp} to ${client.name}`,
    `Committed IP: ${allocatedIp}, Subnet Mask: ${state.config.subnetMask}, DNS: ${state.config.apIp}`
  );

  const newLease: DhcpLease = {
    id: `lease-${client.id}-${Date.now()}`,
    clientMac: client.macAddress,
    clientIp: allocatedIp,
    hostname: client.name,
    issuedAtSimMs: now + 30,
    expiresAtSimMs: now + 30 + 7200 * 1000,
    status: 'active',
  };

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            status: 'CONNECTED',
            assignedIp: allocatedIp!,
            assignedGateway: state.config.apIp,
            assignedSubnet: state.config.subnetMask,
            connectedAtSimMs: now + 30,
            lastEventDescription: `Connected! DHCP lease granted: ${allocatedIp}.`,
          }
        : c
    ),
    dhcpLeases: [...state.dhcpLeases.filter((l) => l.clientMac !== client.macAddress), newLease],
    packets: [...state.packets, pDiscover, pOffer, pRequest, pAck],
    serialLogs: [
      ...state.serialLogs,
      {
        id: `log-${Date.now()}-dhcp-ack`,
        simTimestampMs: now + 30,
        text: `[INFO] DHCP lease assigned: ${allocatedIp} -> Station [${client.macAddress}] ("${client.name}")`,
        level: 'info',
      },
    ],
    activePacketAnimation: {
      id: `anim-${Date.now()}`,
      fromId: 'esp32',
      toId: clientId,
      label: `DHCP ACK: ${allocatedIp}`,
      packetType: 'DHCP_ACK',
      category: 'NETWORK_IP',
      progress: 0,
    },
  };
}

export function disconnectClient(state: SimulationState, clientId: string): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) return state;

  const now = state.simClockMs;
  const disassocPacket = createPacket(
    now,
    'DISASSOC',
    client.name,
    client.macAddress,
    'ESP32 SoftAP',
    state.apBssid,
    `Station ${client.name} sends 802.11 Disassociation`
  );

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            status: 'DISCONNECTED',
            assignedIp: undefined,
            lastEventDescription: 'Disconnected from Wi-Fi access point.',
          }
        : c
    ),
    dhcpLeases: state.dhcpLeases.map((l) =>
      l.clientMac === client.macAddress ? { ...l, status: 'released' as const } : l
    ),
    packets: [...state.packets, disassocPacket],
    serialLogs: [
      ...state.serialLogs,
      {
        id: `log-${Date.now()}-disassoc`,
        simTimestampMs: now,
        text: `[INFO] Station [${client.macAddress}] disassociated. Released DHCP lease.`,
        level: 'info',
      },
    ],
    activePacketAnimation: null,
  };
}

// -------------------------------------------------------------
// Data Communication Simulator
// -------------------------------------------------------------

export function sendPing(state: SimulationState, clientId: string): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  const now = state.simClockMs;

  if (!client || client.status !== 'CONNECTED') {
    return {
      ...state,
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-ping-err`,
          simTimestampMs: now,
          text: `[ERROR] Ping failed: Station is not connected to AP.`,
          level: 'error',
        },
      ],
    };
  }

  if (!client.assignedIp) {
    return {
      ...state,
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-ping-no-ip`,
          simTimestampMs: now,
          text: `[ERROR] Ping failed: Station has no valid IPv4 address assigned (DHCP disabled / unconfigured).`,
          level: 'error',
        },
      ],
      dataTransfers: [
        ...state.dataTransfers,
        {
          id: `ping-${Date.now()}`,
          senderId: client.id,
          receiverId: 'esp32',
          senderName: client.name,
          receiverName: 'ESP32 SoftAP',
          message: 'ICMP Echo (Ping)',
          payloadBytes: 0,
          simTimestampMs: now,
          rttMs: 0,
          status: 'failed',
          errorReason: 'No IPv4 address on station (Destination host unreachable)',
        },
      ],
    };
  }

  if (state.apStatus !== 'RUNNING') {
    return {
      ...state,
      dataTransfers: [
        ...state.dataTransfers,
        {
          id: `ping-${Date.now()}`,
          senderId: client.id,
          receiverId: 'esp32',
          senderName: client.name,
          receiverName: 'ESP32 SoftAP',
          message: 'ICMP Echo (Ping)',
          payloadBytes: 0,
          simTimestampMs: now,
          rttMs: 0,
          status: 'failed',
          errorReason: 'SoftAP is stopped',
        },
      ],
    };
  }

  // Ping calculation
  const rttMs = Math.round((3.2 + Math.abs(client.rssiDbm) * 0.05) * 10) / 10;
  const pingReq = createPacket(now, 'ICMP_ECHO_REQ', client.name, client.assignedIp, 'ESP32 SoftAP', state.config.apIp);
  const pingReply = createPacket(
    now + Math.round(rttMs),
    'ICMP_ECHO_REPLY',
    'ESP32 SoftAP',
    state.config.apIp,
    client.name,
    client.assignedIp,
    `ICMP Echo Reply from ${state.config.apIp}: bytes=32 time=${rttMs}ms TTL=128`
  );

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            txBytes: c.txBytes + 64,
            rxBytes: c.rxBytes + 64,
            lastEventDescription: `Ping to ${state.config.apIp} successful (RTT ${rttMs} ms).`,
          }
        : c
    ),
    packets: [...state.packets, pingReq, pingReply],
    dataTransfers: [
      ...state.dataTransfers,
      {
        id: `ping-${Date.now()}`,
        senderId: client.id,
        receiverId: 'esp32',
        senderName: client.name,
        receiverName: 'ESP32 SoftAP',
        message: 'ICMP Echo Request (32B payload)',
        replyMessage: `ICMP Echo Reply (time=${rttMs}ms)`,
        payloadBytes: 64,
        simTimestampMs: now,
        rttMs,
        status: 'success',
      },
    ],
    serialLogs: [
      ...state.serialLogs,
      {
        id: `log-${Date.now()}-icmp`,
        simTimestampMs: now + Math.round(rttMs),
        text: `[INFO] ICMP Echo Request received from ${client.assignedIp} -> Reply sent (${rttMs}ms)`,
        level: 'info',
      },
    ],
    activePacketAnimation: {
      id: `anim-${Date.now()}`,
      fromId: client.id,
      toId: 'esp32',
      label: `Ping (RTT ${rttMs}ms)`,
      packetType: 'ICMP_ECHO_REQ',
      category: 'NETWORK_IP',
      progress: 0,
    },
  };
}

export function sendApplicationMessage(
  state: SimulationState,
  clientId: string,
  userMessage: string,
  byteCount: number = 64
): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  const now = state.simClockMs;

  if (!client || client.status !== 'CONNECTED' || !client.assignedIp || state.apStatus !== 'RUNNING') {
    const errorReason =
      !client || client.status !== 'CONNECTED'
        ? 'Client device is not connected.'
        : !client.assignedIp
        ? 'Client has no IP address assigned.'
        : 'ESP32 SoftAP is not running.';

    return {
      ...state,
      dataTransfers: [
        ...state.dataTransfers,
        {
          id: `msg-${Date.now()}`,
          senderId: clientId,
          receiverId: 'esp32',
          senderName: client ? client.name : 'Unknown',
          receiverName: 'ESP32 SoftAP',
          message: userMessage,
          payloadBytes: byteCount,
          simTimestampMs: now,
          rttMs: 0,
          status: 'failed',
          errorReason,
        },
      ],
      serialLogs: [
        ...state.serialLogs,
        {
          id: `log-${Date.now()}-msg-err`,
          simTimestampMs: now,
          text: `[ERROR] Data transfer failed: ${errorReason}`,
          level: 'error',
        },
      ],
    };
  }

  // Realistic simulated ESP32 response based on command
  let responseText = `ECHO: "${userMessage}"`;
  const upper = userMessage.trim().toUpperCase();
  if (upper === 'HELLO ESP32') {
    responseText = 'HELLO CLIENT';
  } else if (upper.includes('STATUS')) {
    responseText = `ESP32 AP Uptime: ${Math.round(state.simClockMs / 1000)}s | Connected: ${
      state.clients.filter((c) => c.status === 'CONNECTED').length
    }/${state.config.maxClients} | Free Heap: 284120 B`;
  } else if (upper.includes('LED_ON')) {
    responseText = 'GPIO2 LED ON [State 1]';
  } else if (upper.includes('LED_OFF')) {
    responseText = 'GPIO2 LED OFF [State 0]';
  } else if (upper.includes('GET_TEMP')) {
    responseText = 'Internal Temp: 38.4 C | Hall Sensor: 142';
  }

  const rttMs = Math.round((5.0 + byteCount * 0.02) * 10) / 10;
  const payloadSize = Math.max(byteCount, userMessage.length);

  const reqPacket = createPacket(
    now,
    'APP_DATA_REQ',
    client.name,
    client.assignedIp,
    'ESP32 SoftAP',
    state.config.apIp,
    `Application Request: "${userMessage}" (${payloadSize} B)`,
    `TCP/HTTP Port 80 payload: ${userMessage}`
  );

  const respPacket = createPacket(
    now + Math.round(rttMs),
    'APP_DATA_RESP',
    'ESP32 SoftAP',
    state.config.apIp,
    client.name,
    client.assignedIp,
    `Application Response: "${responseText}"`,
    `TCP/HTTP Port 80 response: ${responseText}`
  );

  return {
    ...state,
    clients: state.clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            txBytes: c.txBytes + payloadSize,
            rxBytes: c.rxBytes + responseText.length,
            lastEventDescription: `Sent "${userMessage}" -> Recv "${responseText}".`,
          }
        : c
    ),
    packets: [...state.packets, reqPacket, respPacket],
    dataTransfers: [
      ...state.dataTransfers,
      {
        id: `msg-${Date.now()}`,
        senderId: client.id,
        receiverId: 'esp32',
        senderName: client.name,
        receiverName: 'ESP32 SoftAP',
        message: userMessage,
        replyMessage: responseText,
        payloadBytes: payloadSize,
        simTimestampMs: now,
        rttMs,
        status: 'success',
      },
    ],
    serialLogs: [
      ...state.serialLogs,
      {
        id: `log-${Date.now()}-rx`,
        simTimestampMs: now,
        text: `[APP] Station [${client.assignedIp}] sent ${payloadSize} bytes: "${userMessage}"`,
        level: 'info',
      },
      {
        id: `log-${Date.now()}-tx`,
        simTimestampMs: now + Math.round(rttMs),
        text: `[APP] ESP32 response sent to [${client.assignedIp}]: "${responseText}"`,
        level: 'info',
      },
    ],
    activePacketAnimation: {
      id: `anim-${Date.now()}`,
      fromId: client.id,
      toId: 'esp32',
      label: `Data: "${userMessage.substring(0, 16)}"`,
      packetType: 'APP_DATA_REQ',
      category: 'APPLICATION',
      progress: 0,
    },
  };
}

export function addNewClient(state: SimulationState, name: string, type: DeviceType): SimulationState {
  const count = state.clients.length + 1;
  const hex = count.toString(16).padStart(2, '0').toUpperCase();
  const newClient: ClientDevice = {
    id: `client-${Date.now()}`,
    name: name || `Device #${count}`,
    type,
    macAddress: `4A:88:12:00:3C:${hex}`,
    status: 'OFFLINE',
    targetSsid: state.config.ssid,
    inputPassword: state.config.password,
    useManualIp: false,
    rssiDbm: -55 - Math.floor(Math.random() * 20),
    txBytes: 0,
    rxBytes: 0,
    lastEventDescription: 'Created simulated client device.',
  };

  return {
    ...state,
    clients: [...state.clients, newClient],
    selectedClientId: newClient.id,
  };
}

export function removeClient(state: SimulationState, clientId: string): SimulationState {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) return state;

  return {
    ...state,
    clients: state.clients.filter((c) => c.id !== clientId),
    dhcpLeases: state.dhcpLeases.filter((l) => l.clientMac !== client.macAddress),
    selectedClientId: state.selectedClientId === clientId ? null : state.selectedClientId,
  };
}
