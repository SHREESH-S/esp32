/**
 * ESP32 Wi-Fi AP Lab - Type Definitions
 * Represents all data structures, states, packets, and interfaces for the virtual laboratory.
 */

export type ApStatus = 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'ERROR';

export type ClientStatus =
  | 'OFFLINE'
  | 'SCANNING'
  | 'NETWORK_FOUND'
  | 'AUTHENTICATING'
  | 'ASSOCIATING'
  | 'REQUESTING_IP'
  | 'CONNECTED'
  | 'DISCONNECTING'
  | 'DISCONNECTED'
  | 'FAILED';

export type DeviceType = 'smartphone' | 'laptop' | 'tablet' | 'iot_device';

export type SecurityMode = 'WPA2_PSK' | 'OPEN';

export interface NetworkConfiguration {
  ssid: string;
  password: string;
  apIp: string;
  subnetMask: string;
  channel: number;
  maxClients: number;
  security: SecurityMode;
  dhcpEnabled: boolean;
  beaconIntervalMs: number;
}

export interface DhcpLease {
  id: string;
  clientMac: string;
  clientIp: string;
  hostname: string;
  issuedAtSimMs: number;
  expiresAtSimMs: number;
  status: 'active' | 'released' | 'expired';
}

export interface ClientDevice {
  id: string;
  name: string;
  type: DeviceType;
  macAddress: string;
  status: ClientStatus;
  targetSsid: string;
  inputPassword: string;
  useManualIp: boolean;
  manualIp?: string;
  manualSubnet?: string;
  manualGateway?: string;
  assignedIp?: string;
  assignedGateway?: string;
  assignedSubnet?: string;
  rssiDbm: number;
  connectedAtSimMs?: number;
  txBytes: number;
  rxBytes: number;
  lastEventDescription: string;
  failureReason?: string;
}

export type PacketCategory =
  | 'WIFI_MANAGEMENT'
  | 'NETWORK_IP'
  | 'TRANSPORT'
  | 'APPLICATION';

export type PacketType =
  | 'BEACON'
  | 'PROBE_REQ'
  | 'PROBE_RESP'
  | 'AUTH_REQ'
  | 'AUTH_RESP'
  | 'ASSOC_REQ'
  | 'ASSOC_RESP'
  | 'DHCP_DISCOVER'
  | 'DHCP_OFFER'
  | 'DHCP_REQUEST'
  | 'DHCP_ACK'
  | 'ARP_REQ'
  | 'ARP_RESP'
  | 'ICMP_ECHO_REQ'
  | 'ICMP_ECHO_REPLY'
  | 'TCP_SYN'
  | 'TCP_SYN_ACK'
  | 'TCP_ACK'
  | 'APP_DATA_REQ'
  | 'APP_DATA_RESP'
  | 'DISASSOC'
  | 'DEAUTH';

export interface PacketTechnicalDetails {
  layer2?: string;
  layer3?: string;
  layer4?: string;
  frameControl?: string;
  sequenceNumber?: number;
  payloadSummary?: string;
}

export interface PacketEvent {
  id: string;
  simTimestampMs: number;
  category: PacketCategory;
  type: PacketType;
  sourceName: string;
  sourceMacOrIp: string;
  destName: string;
  destMacOrIp: string;
  sizeBytes: number;
  summary: string;
  technicalDetails: PacketTechnicalDetails;
  beginnerExplanation: string;
  engineeringExplanation: string;
}

export interface SerialLogEntry {
  id: string;
  simTimestampMs: number;
  text: string;
  level: 'info' | 'warn' | 'error' | 'debug';
}

export interface DataTransfer {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  message: string;
  replyMessage?: string;
  payloadBytes: number;
  simTimestampMs: number;
  rttMs: number;
  status: 'success' | 'failed';
  errorReason?: string;
}

export interface ActivePacketAnimation {
  id: string;
  fromId: string; // 'esp32' or client.id
  toId: string;
  label: string;
  packetType: PacketType;
  category: PacketCategory;
  progress: number; // 0 to 1
}

export interface SimulationState {
  config: NetworkConfiguration;
  apStatus: ApStatus;
  apStartupStage: number; // 0 (idle) to 8 (complete)
  apBssid: string;
  clients: ClientDevice[];
  selectedClientId: string | null;
  selectedPacketId: string | null;
  activePacketAnimation: ActivePacketAnimation | null;
  dhcpLeases: DhcpLease[];
  packets: PacketEvent[];
  serialLogs: SerialLogEntry[];
  dataTransfers: DataTransfer[];
  simClockMs: number;
  isClockRunning: boolean;
  clockSpeed: number; // 1, 2, 5
  explanationMode: 'beginner' | 'engineering';
  lastError: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
