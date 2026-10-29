/**
 * ESP32 Wi-Fi AP Lab - 12 Guided Experiments
 * Step-by-step interactive lab exercises with challenge prediction mode.
 */

export interface GuidedExperiment {
  id: number;
  title: string;
  objective: string;
  startingConditions: string;
  steps: string[];
  expectedResult: string;
  observedLogExplanation: string;
  challengeQuestion: string;
  challengeOptions: string[];
  correctOptionIndex: number;
  challengeExplanation: string;
  setupPreset?: {
    apRunning?: boolean;
    ssid?: string;
    password?: string;
    maxClients?: number;
    dhcpEnabled?: boolean;
    apIp?: string;
    security?: 'WPA2_PSK' | 'OPEN';
    clientAction?: 'connect' | 'wrong_pass' | 'disable_dhcp' | 'custom_ip';
  };
}

export const GUIDED_EXPERIMENTS: GuidedExperiment[] = [
  {
    id: 1,
    title: 'Start a Basic Access Point',
    objective: 'Observe the 8-stage internal startup sequence of the ESP32 SoftAP subsystem.',
    startingConditions: 'Simulation reset with Access Point stopped.',
    steps: [
      'Navigate to the "Simulation Lab" tab.',
      'Click the green "Start Access Point" button.',
      'Watch the 8 startup stages progress from configuration validation to beacon broadcast.',
      'Verify the status indicator changes from STOPPED to RUNNING.',
    ],
    expectedResult:
      'AP transitions through all 8 stages, begins broadcasting 802.11 Beacon frames, and assigns itself the IP address 192.168.4.1.',
    observedLogExplanation:
      'Serial monitor displays: WiFi.mode(WIFI_AP), WiFi.softAP("ESP32_LAB_AP"), AP started IP: 192.168.4.1, DHCP server enabled.',
    challengeQuestion: 'What is the very first frame transmitted into the air once the SoftAP finishes initialization?',
    challengeOptions: [
      'DHCP ACK',
      '802.11 Beacon frame',
      'ICMP Echo Reply',
      'TCP SYN packet',
    ],
    correctOptionIndex: 1,
    challengeExplanation:
      'The AP periodically broadcasts 802.11 Beacon management frames to announce its presence, SSID, and capabilities to nearby devices.',
    setupPreset: {
      apRunning: false,
    },
  },
  {
    id: 2,
    title: 'Connect One Smartphone Client',
    objective: 'Trace the complete 802.11 scan, probe, authentication, and association sequence for a single station.',
    startingConditions: 'AP running with default SSID "ESP32_LAB_AP".',
    steps: [
      'Ensure the Access Point is running.',
      'Click on the "Pixel Smartphone" node in the topology diagram.',
      'Click "Connect to AP" in the client panel.',
      'Observe the animated Probe Request, Probe Response, Auth, and Assoc packets.',
    ],
    expectedResult:
      'Client completes 802.11 association, triggers DHCP to obtain 192.168.4.2, and reaches the CONNECTED state.',
    observedLogExplanation:
      'The ESP32 registers station 3C:06:30:4A:88:12, logs authentication success, and issues Association ID #1.',
    challengeQuestion: 'In what order does a Wi-Fi client establish communication with an Access Point?',
    challengeOptions: [
      'DHCP Request -> Probe -> Assoc -> Auth',
      'Probe (Scan) -> Authentication -> Association -> DHCP IP',
      'Association -> DHCP Discover -> Probe -> Authentication',
      'Ping -> TCP Handshake -> Wi-Fi Scan',
    ],
    correctOptionIndex: 1,
    challengeExplanation:
      'Standards require discovering the network first (Probe), then link-layer Authentication, then Association, and finally layer-3 DHCP configuration.',
    setupPreset: {
      apRunning: true,
    },
  },
  {
    id: 3,
    title: 'Connect Multiple Clients',
    objective: 'Observe how the ESP32 maintains simultaneous associations and assigns separate IP addresses.',
    startingConditions: 'AP running; first client (Smartphone) already connected.',
    steps: [
      'Select the second device: "ThinkPad Laptop".',
      'Click "Connect to AP".',
      'Observe the new association and DHCP lease issuance.',
      'Inspect the Network Inspector tab to see both clients listed with active connections.',
    ],
    expectedResult:
      'ThinkPad Laptop receives the next consecutive IP in the DHCP pool: 192.168.4.3.',
    observedLogExplanation:
      'Serial monitor logs: Station [F0:D5:BF:19:E2:44] associated (AID: 2), DHCP lease assigned: 192.168.4.3.',
    challengeQuestion: 'Can two Wi-Fi clients connected to the same AP share the same IP address?',
    challengeOptions: [
      'Yes, if they use the same password',
      'No, duplicate IPs cause ARP collisions and packet corruption',
      'Yes, Wi-Fi ignores IP addresses completely',
      'Only if one is a laptop and one is a phone',
    ],
    correctOptionIndex: 1,
    challengeExplanation:
      'Every host on an IP network must have a unique IPv4 address; otherwise, packets cannot be deterministically routed to the correct destination.',
    setupPreset: {
      apRunning: true,
    },
  },
  {
    id: 4,
    title: 'Observe DHCP Address Assignment (D-O-R-A)',
    objective: 'Inspect the 4-way DHCP exchange in the Packet Explorer.',
    startingConditions: 'AP running with DHCP enabled.',
    steps: [
      'Connect any offline client.',
      'Switch over to the "Packet Explorer" tab.',
      'Filter the packet list by category "NETWORK_IP".',
      'Click each of the 4 packets: DISCOVER, OFFER, REQUEST, ACK to examine their headers.',
    ],
    expectedResult:
      'Client broadcasts DISCOVER on 0.0.0.0:68, AP sends OFFER with 192.168.4.x, Client sends REQUEST, AP returns ACK.',
    observedLogExplanation:
      'Shows how dynamic IP configuration occurs immediately after layer-2 association finishes.',
    challengeQuestion: 'Why does the initial DHCP Discover packet use source IP 0.0.0.0 and destination 255.255.255.255?',
    challengeOptions: [
      'It is an encryption key format',
      'The client does not yet have an IP address and does not know where the DHCP server is',
      'It represents an IPv6 address translated into IPv4',
      'It is a special test packet ignored by routers',
    ],
    correctOptionIndex: 1,
    challengeExplanation:
      '0.0.0.0 signifies "this host on this network without an IP", and 255.255.255.255 broadcasts to every device on the local link.',
    setupPreset: {
      apRunning: true,
    },
  },
  {
    id: 5,
    title: 'Enter the Wrong Wi-Fi Password',
    objective: 'Observe 802.11 authentication failure when WPA2 credentials do not match.',
    startingConditions: 'AP running with WPA2-PSK security enabled.',
    steps: [
      'Select a client device in the topology diagram.',
      'In the client configuration, change the password to "wrongpassword123".',
      'Click "Connect to AP".',
      'Watch the simulation stop at the AUTHENTICATING stage.',
    ],
    expectedResult:
      'Client receives an Authentication Response with error status code 1. Status changes to FAILED.',
    observedLogExplanation:
      'Serial monitor logs: [WARN] Station authentication failure: WPA2 key mismatch.',
    challengeQuestion: 'At what stage in the connection sequence is a wrong password detected?',
    challengeOptions: [
      'During DHCP IP assignment',
      'During 802.11 Authentication before Association',
      'During Beacon listening',
      'Only when the client tries to open a webpage',
    ],
    correctOptionIndex: 1,
    challengeExplanation:
      'Authentication occurs before Association. If credentials fail, the AP rejects the handshake and never registers the station in its table.',
    setupPreset: {
      apRunning: true,
      clientAction: 'wrong_pass',
    },
  },
  {
    id: 6,
    title: 'Exceed the Client Limit',
    objective: 'Verify that the ESP32 enforces its maximum configured station limit.',
    startingConditions: 'AP configured with Maximum Clients = 2.',
    steps: [
      'In the Access Point Configuration panel, set "Maximum Clients" to 2 and restart the AP.',
      'Connect the first client (Smartphone) -> Successful.',
      'Connect the second client (Laptop) -> Successful (2 of 2 slots full).',
      'Attempt to connect the third client (Tablet).',
    ],
    expectedResult:
      'The 3rd client receives an 802.11 Association Response with Status Code 17 (Association denied: AP table full) and enters FAILED state.',
    observedLogExplanation:
      'Serial monitor: [ERROR] Association rejected for station: max_connection limit reached.',
    challengeQuestion: 'Why does an ESP32 limit the number of connected stations (typically 4 to 8)?',
    challengeOptions: [
      'Due to physical silicon RAM constraints for station descriptors and packet buffers',
      'Because Wi-Fi only has 8 channels',
      'To prevent the antenna from overheating',
      'Due to legal regulations in the 2.4GHz band',
    ],
    correctOptionIndex: 0,
    challengeExplanation:
      'Each associated station requires dedicated memory in the ESP32 lwIP stack for frame buffers, encryption keys, and transmission queues.',
    setupPreset: {
      apRunning: true,
      maxClients: 2,
    },
  },
  {
    id: 7,
    title: 'Disable DHCP Service',
    objective: 'Demonstrate that Wi-Fi association and IP assignment are two independent layers.',
    startingConditions: 'Access Point stopped.',
    steps: [
      'In the AP Configuration panel, toggle "DHCP Server" to DISABLED.',
      'Start the Access Point.',
      'Connect the Smartphone client.',
      'Observe that the client shows "Associated" at Layer 2, but has NO IPv4 address.',
      'Try clicking "Ping AP" from the client.',
    ],
    expectedResult:
      'Client is successfully connected wirelessly, but Ping fails with "No route to host / IP not configured".',
    observedLogExplanation:
      'Serial monitor: [WARN] Station associated, but DHCP server is disabled. Station has no IPv4 lease.',
    challengeQuestion: 'Can two devices communicate via IP if they are associated over Wi-Fi but have no IP addresses?',
    challengeOptions: [
      'Yes, Wi-Fi automatically creates virtual IPs',
      'No, Layer 3 (IP) routing requires valid IPv4/IPv6 addresses',
      'Yes, via Bluetooth bridge',
      'Only if they are less than 1 meter apart',
    ],
    correctOptionIndex: 1,
    challengeExplanation:
      'Wi-Fi (Layer 2) only delivers frames between MAC addresses. IP applications (Layer 3/4) strictly require IP addressing.',
    setupPreset: {
      apRunning: false,
      dhcpEnabled: false,
    },
  },
  {
    id: 8,
    title: 'Configure a Custom AP IP Address',
    objective: 'Use WiFi.softAPConfig() to change the default 192.168.4.1 gateway to 10.0.0.1.',
    startingConditions: 'Access Point stopped.',
    steps: [
      'In the AP Configuration panel, change AP IP Address to 10.0.0.1.',
      'Verify Subnet Mask is 255.255.255.0.',
      'Click "Start Access Point".',
      'Connect a client and check what IP it receives via DHCP.',
    ],
    expectedResult:
      'ESP32 SoftAP runs on 10.0.0.1, and the connected client receives 10.0.0.2.',
    observedLogExplanation:
      'Serial monitor: WiFi.softAPConfig(10.0.0.1, 10.0.0.1, 255.255.255.0) -> AP IP: 10.0.0.1.',
    challengeQuestion: 'What Arduino-ESP32 function is used to specify a custom IP for the SoftAP?',
    challengeOptions: [
      'WiFi.setCustomIP()',
      'WiFi.softAPConfig(local_ip, gateway, subnet)',
      'WiFi.changeAddress()',
      'IPAddress.override()',
    ],
    correctOptionIndex: 1,
    challengeExplanation:
      'WiFi.softAPConfig(local_ip, gateway, subnet) must be called prior to WiFi.softAP() to configure custom network addressing.',
    setupPreset: {
      apRunning: false,
      apIp: '10.0.0.1',
    },
  },
  {
    id: 9,
    title: 'Send Application Message to ESP32',
    objective: 'Transmit a simulated command from a connected client and observe the ESP32 response.',
    startingConditions: 'AP running; Smartphone connected with valid IP address.',
    steps: [
      'In the Simulation Lab, scroll down to the "Data Communication" section.',
      'Select "Pixel Smartphone" as the sender.',
      'Select the message preset "HELLO ESP32" or type "STATUS".',
      'Click "Send Message".',
      'Observe the animated packet traveling to the ESP32 and the reply returned.',
    ],
    expectedResult:
      'ESP32 processes the message, logs the request on the serial monitor, and replies back with "HELLO CLIENT" or system telemetry.',
    observedLogExplanation:
      'Serial monitor: [APP] Station sent 11 bytes: "HELLO ESP32" -> ESP32 response: "HELLO CLIENT".',
    challengeQuestion: 'In a real physical ESP32 project, what firmware code handles incoming client data?',
    challengeOptions: [
      'A WebServer or WiFiServer socket listener in the Arduino loop()',
      'The analogRead() function',
      'The ESP32 bootloader',
      'The Wi-Fi antenna driver automatically',
    ],
    correctOptionIndex: 0,
    challengeExplanation:
      'The firmware sketch runs a TCP socket server (e.g., WiFiServer server(80)) or WebServer that accepts client connections and reads data streams.',
    setupPreset: {
      apRunning: true,
    },
  },
  {
    id: 10,
    title: 'Stop the AP During an Active Data Transfer',
    objective: 'Observe network resilience and error handling when the access point experiences sudden shutdown.',
    startingConditions: 'Client connected and actively communicating.',
    steps: [
      'Initiate a message transfer from the client.',
      'Click the red "Stop Access Point" button.',
      'Observe how active packets and sockets immediately abort.',
      'Check the transfer status in the Transfer History table.',
    ],
    expectedResult:
      'Transfer is marked FAILED with reason: "AP stopped during transfer". All clients are deauthenticated.',
    observedLogExplanation:
      'Serial monitor: WiFi.softAPdisconnect(true) -> SoftAP stopped. Disconnecting all stations.',
    challengeQuestion: 'What frame should an AP send before shutting down if time permits?',
    challengeOptions: [
      '802.11 Deauthentication frame with Reason Code 3 (Leaving BSS)',
      'A DHCP Offer frame',
      'An HTTP 404 page',
      'A beacon with zero interval',
    ],
    correctOptionIndex: 0,
    challengeExplanation:
      'Deauthentication frames notify client stations that the BSS is terminating, preventing clients from waiting through long keep-alive timeouts.',
    setupPreset: {
      apRunning: true,
    },
  },
  {
    id: 11,
    title: 'Compare Open and WPA2-Secured Networks',
    objective: 'Observe the difference in the 802.11 handshake between an open network and a secured network.',
    startingConditions: 'Access Point stopped.',
    steps: [
      'In the AP Configuration panel, set Security Mode to OPEN.',
      'Notice the password field becomes disabled.',
      'Start the Access Point.',
      'Connect a client device.',
      'Inspect the packet exchange in the Packet Explorer.',
    ],
    expectedResult:
      'Client connects directly without requiring pre-shared key validation.',
    observedLogExplanation:
      'Serial monitor: WiFi.softAP("ESP32_LAB_AP") [OPEN NETWORK, NO PASSWORD].',
    challengeQuestion: 'Does an OPEN Wi-Fi network encrypt data transmitted over the air?',
    challengeOptions: [
      'No, raw Wi-Fi frames are transmitted in plaintext and can be captured by any nearby radio',
      'Yes, it automatically uses AES-256',
      'Yes, the SSID encrypts the packets',
      'Only during daytime hours',
    ],
    correctOptionIndex: 0,
    challengeExplanation:
      'Open networks provide zero layer-2 encryption. Anyone with a Wi-Fi card in monitor mode can eavesdrop on plaintext packets.',
    setupPreset: {
      apRunning: false,
      security: 'OPEN',
    },
  },
  {
    id: 12,
    title: 'Disconnect Client and Inspect Event Log',
    objective: 'Examine 802.11 disassociation and the release of DHCP address leases.',
    startingConditions: 'AP running with one or more connected clients.',
    steps: [
      'Select the connected client.',
      'Click "Disconnect".',
      'Inspect the "Network Inspector" tab to see the DHCP lease change from "active" to "released".',
      'Review the Serial Monitor for the disassociation log.',
    ],
    expectedResult:
      'Client sends an 802.11 Disassociation frame, releases its IP, and returns to DISCONNECTED state.',
    observedLogExplanation:
      'Serial monitor: [INFO] Station [MAC] disassociated. Released DHCP lease.',
    challengeQuestion: 'What happens to a released DHCP IP address on the ESP32?',
    challengeOptions: [
      'It is returned to the pool and can be reassigned to the next client that connects',
      'It is permanently deleted from the ESP32 flash memory',
      'The ESP32 must reboot before it can be used again',
      'It is converted into a broadcast address',
    ],
    correctOptionIndex: 0,
    challengeExplanation:
      'Dynamic address allocation reclaims released IP addresses so other devices can join without exhausting the small pool.',
    setupPreset: {
      apRunning: true,
    },
  },
];
