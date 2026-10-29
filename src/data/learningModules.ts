/**
 * ESP32 Wi-Fi AP Lab - Educational Learning Modules
 * 14 structured modules covering embedded Wi-Fi, 802.11 standards, and IP networking.
 */

export interface LearningModule {
  id: number;
  title: string;
  category: 'Fundamentals' | 'Wi-Fi Protocol' | 'IP Networking' | 'Firmware & Debugging';
  simpleExplanation: string;
  technicalExplanation: string;
  realWorldAnalogy: string;
  visualDiagram: string;
  practicalExperiment: string;
  questions: {
    question: string;
    answer: string;
  }[];
  relatedControls: string;
}

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 1,
    title: 'What is an ESP32?',
    category: 'Fundamentals',
    simpleExplanation:
      'The ESP32 is a low-cost, powerful microchip with built-in Wi-Fi and Bluetooth. It is widely used by engineers and hobbyists to create connected Internet-of-Things (IoT) gadgets like smart thermostats, weather stations, and robotics.',
    technicalExplanation:
      'Designed by Espressif Systems, the ESP32 integrates a dual-core Xtensa 32-bit LX6 microprocessor operating up to 240 MHz, 520 KB SRAM, 4 MB flash memory, an 802.11 b/g/n baseband MAC/PHY transceiver, Bluetooth v4.2 BR/EDR and BLE, cryptographic hardware accelerators (AES, SHA-2, RSA, ECC), and power management units.',
    realWorldAnalogy:
      'Think of the ESP32 as a tiny pocket computer with its own built-in walkie-talkie radio. It does not need an external network card to communicate wirelessly.',
    visualDiagram:
      '+---------------------------------------------------------+\n|                       ESP32 SoC                         |\n|  +--------------------+   +--------------------------+  |\n|  | Dual-Core 240MHz   |   | Wi-Fi 802.11b/g/n Transceiver|  |\n|  | Xtensa LX6 CPU     |   | 2.4 GHz RF Front-End     |  |\n|  +--------------------+   +--------------------------+  |\n|  +--------------------+   +--------------------------+  |\n|  | 520 KB SRAM        |   | lwIP TCP/IP Stack        |  |\n|  +--------------------+   +--------------------------+  |\n+---------------------------------------------------------+',
    practicalExperiment:
      'Observe the top header: the ESP32 is operating as the central coordinator node hosting the simulated RF transceiver.',
    questions: [
      {
        question: 'What wireless technologies are integrated directly onto the ESP32 silicon?',
        answer: '2.4 GHz Wi-Fi (802.11 b/g/n) and Bluetooth (Classic + BLE).',
      },
      {
        question: 'What operating frequency does the ESP32 CPU typically run at?',
        answer: 'Up to 240 MHz across two 32-bit Xtensa cores.',
      },
      {
        question: 'Does the ESP32 require an operating system like Linux to run Wi-Fi?',
        answer: 'No. It runs bare-metal C++ firmware or FreeRTOS with a lightweight network stack (lwIP).',
      },
    ],
    relatedControls: 'View the Firmware tab to see direct C++ code running on the ESP32.',
  },
  {
    id: 2,
    title: 'What is a Wi-Fi Access Point?',
    category: 'Fundamentals',
    simpleExplanation:
      'A Wi-Fi Access Point (AP) acts as a central radio hub. Just like a cellular cell tower connects smartphones in a neighborhood, an access point lets nearby Wi-Fi devices discover and connect to a single wireless local network.',
    technicalExplanation:
      'In IEEE 802.11 infrastructure architecture, an Access Point (AP) is a station configured to provide access to distribution services. It establishes a Basic Service Set (BSS) identified by a unique 48-bit Basic Service Set Identifier (BSSID, usually its MAC address) and broadcasts an SSID parameter set.',
    realWorldAnalogy:
      'An Access Point is like a conference room host. The host welcomes attendees at the door, gives them visitor badges, and allows them to talk with everyone inside the room.',
    visualDiagram:
      '         [Laptop Client]             [Smartphone Client]\n                 \\                         /\n                  \\   (802.11 Radio Wave) /\n                   v                     v\n            +-----------------------------------+\n            |    ESP32 Access Point (SoftAP)    |\n            |     BSSID: 24:6F:28:B1:C3:90      |\n            +-----------------------------------+',
    practicalExperiment:
      'Click "Start Access Point" in the simulation lab and watch the ESP32 radio radiate Wi-Fi broadcast waves.',
    questions: [
      {
        question: 'What identifies an Access Point at the hardware (MAC) layer?',
        answer: 'The BSSID (Basic Service Set Identifier), which is a 48-bit MAC address.',
      },
      {
        question: 'What is the human-readable network name broadcast by an AP?',
        answer: 'The SSID (Service Set Identifier), up to 32 characters long.',
      },
      {
        question: 'Can devices talk to each other without an Access Point?',
        answer: 'Yes, in Wi-Fi Direct or Ad-Hoc (IBSS) modes, but infrastructure mode with an AP is standard.',
      },
    ],
    relatedControls: 'Controls: Start / Stop Access Point buttons.',
  },
  {
    id: 3,
    title: 'What is SoftAP mode?',
    category: 'Fundamentals',
    simpleExplanation:
      'SoftAP stands for "Software Access Point". Instead of buying a dedicated expensive Wi-Fi router, the ESP32 uses software drivers to turn its small chip into a functioning Wi-Fi access point right on your desk.',
    technicalExplanation:
      'SoftAP enables a wireless network interface card or embedded microcontroller to emulate an 802.11 AP in software. The ESP32 Wi-Fi hardware MAC layer handles frame filtering while the software stack manages beacon transmission, association tables, client tracking, and DHCP service.',
    realWorldAnalogy:
      'Turning on "Personal Hotspot" on your smartphone is an exact real-world example of SoftAP: your phone becomes a mini router for your laptop.',
    visualDiagram:
      '+---------------------------------------------------+\n|             ESP32 Firmware Architecture           |\n|  +--------------------+   +--------------------+  |\n|  | Arduino User Code  |   | Web / Socket Server|  |\n|  +--------------------+   +--------------------+  |\n|  +---------------------------------------------+  |\n|  | lwIP TCP/IP Stack + DHCP Server             |  |\n|  +---------------------------------------------+  |\n|  | ESP-IDF Wi-Fi Driver: SoftAP MAC Engine      |  |\n|  +---------------------------------------------+  |\n+---------------------------------------------------+',
    practicalExperiment:
      'Compare standard router hardware to the ESP32 SoftAP: notice the ESP32 is powered via 3.3V and supports up to 4–8 clients.',
    questions: [
      {
        question: 'What does "Soft" in SoftAP stand for?',
        answer: 'Software-enabled Access Point, running AP protocols in firmware.',
      },
      {
        question: 'What is the default IP address of an ESP32 in SoftAP mode?',
        answer: '192.168.4.1 (configurable via WiFi.softAPConfig).',
      },
      {
        question: 'Does the ESP32 SoftAP automatically connect to the Internet?',
        answer: 'No. SoftAP only provides a local private network between the ESP32 and connected clients.',
      },
    ],
    relatedControls: 'Configuration Panel -> SSID & Security Mode.',
  },
  {
    id: 4,
    title: 'Access Point versus Station mode',
    category: 'Fundamentals',
    simpleExplanation:
      'Station (STA) mode means the ESP32 acts like a client connecting to your home router. Access Point (AP) mode means the ESP32 creates its own network. It can also do both simultaneously (AP+STA mode).',
    technicalExplanation:
      'In STA (Station) mode, the ESP32 associates to an existing 802.11 BSS, scans for beacons, and requests an IP from the home router. In AP mode, the ESP32 acts as the BSS coordinator, broadcasts beacons, and responds to probe requests.',
    realWorldAnalogy:
      'STA mode is like a student joining a classroom. AP mode is like the teacher standing at the chalkboard directing the class.',
    visualDiagram:
      'STA MODE:   [ESP32] ---------> [Home Wi-Fi Router] ---------> [Internet]\n\nAP MODE:    [Phone] ---------> [ESP32 SoftAP]   (Local Only, No Router)',
    practicalExperiment:
      'Check the Serial Monitor: `WiFi.mode(WIFI_AP)` explicitly instructs the ESP32 silicon to switch off station scanning and begin AP hosting.',
    questions: [
      {
        question: 'Which mode does an ESP32 use when it joins your home Wi-Fi?',
        answer: 'Station (STA) mode.',
      },
      {
        question: 'Can the ESP32 run both AP and STA at the same time?',
        answer: 'Yes, via WiFi.mode(WIFI_AP_STA), enabling Wi-Fi repeaters and provisioning portals.',
      },
      {
        question: 'Which mode is used for initial smart-device setup (captive portals)?',
        answer: 'SoftAP mode, so a smartphone can connect directly to configure home Wi-Fi credentials.',
      },
    ],
    relatedControls: 'Firmware tab -> Notice `WiFi.mode(WIFI_AP)` call.',
  },
  {
    id: 5,
    title: 'How an SSID is broadcast',
    category: 'Wi-Fi Protocol',
    simpleExplanation:
      'An SSID (Service Set Identifier) is the Wi-Fi name you see when searching for networks. The ESP32 shouts this name approximately 10 times every second using special "beacon" radio signals.',
    technicalExplanation:
      '802.11 Beacon frames are management frames (Type 00, Subtype 1000) sent periodically at a configurable Target Beacon Transmission Time (TBTT, default 100 TU ≈ 102.4 ms). They carry information elements including SSID, supported data rates, DS Parameter Set (channel), and RSN capabilities (WPA2 ciphers).',
    realWorldAnalogy:
      'A lighthouse shining its beam once every few seconds so passing ships can spot its name and location.',
    visualDiagram:
      'ESP32 SoftAP --[ Beacon Frame (SSID, Ch, WPA2) ]--> Airwave (Broadcast)\n    |               |               |\n  t = 0ms        t = 100ms       t = 200ms',
    practicalExperiment:
      'Open the "Packet Explorer" tab. Filter by protocol "WIFI_MANAGEMENT" and inspect the repeating BEACON frames.',
    questions: [
      {
        question: 'What is the default beacon interval in standard 802.11 networks?',
        answer: '100 Time Units (TU), approximately 102.4 milliseconds.',
      },
      {
        question: 'Can an Access Point hide its SSID?',
        answer: 'Yes, by broadcasting a zero-length (null) SSID in the beacon frame.',
      },
      {
        question: 'Does a hidden SSID prevent hackers from finding the network?',
        answer: 'No, because probe requests and client association frames still expose the SSID in plaintext.',
      },
    ],
    relatedControls: 'Access Point Config -> Beacon interval (ms).',
  },
  {
    id: 6,
    title: 'Wi-Fi scanning and discovery',
    category: 'Wi-Fi Protocol',
    simpleExplanation:
      'When your phone wants to find Wi-Fi, it listens for beacons (passive scan) or sends out a "Probe Request" asking "Who is out there?" (active scan). The ESP32 replies with a "Probe Response".',
    technicalExplanation:
      'In an active scan, the station tunes to channel 1..13 and transmits an 802.11 Probe Request (Subtype 0100) with a broadcast or directed destination address. The SoftAP intercepts the frame, verifies the SSID, and responds with a Probe Response (Subtype 0101) within the SIFS/DIFS timing slot.',
    realWorldAnalogy:
      'Passive scan: Sitting quietly and listening for people speaking. Active scan: Calling out "Is anyone here?" and waiting for a reply.',
    visualDiagram:
      'Client Device                      ESP32 SoftAP\n     |                                  |\n     |--- Probe Request (SSID: Any) --->|\n     |<-- Probe Response (ESP32_LAB_AP)-|',
    practicalExperiment:
      'Select a client device and click "Connect". Watch the topology canvas animate the Probe Request dot from the device to the ESP32.',
    questions: [
      {
        question: 'What is the difference between active and passive scanning?',
        answer: 'Active scanning transmits probe requests; passive scanning only listens for beacon frames.',
      },
      {
        question: 'What is the frame category of a Probe Request?',
        answer: '802.11 Management Frame.',
      },
      {
        question: 'What information does the Probe Response provide back to the client?',
        answer: 'SSID, supported bitrates, channel frequency, and encryption requirements.',
      },
    ],
    relatedControls: 'Topology Canvas -> Select Client -> Click "Connect".',
  },
  {
    id: 7,
    title: 'Authentication and association',
    category: 'Wi-Fi Protocol',
    simpleExplanation:
      'Before exchanging data, a client must shake hands with the AP. First comes 802.11 Authentication ("Are you allowed to talk to me?"), then Association ("You are registered as station #1").',
    technicalExplanation:
      '802.11 link establishment is a two-step handshake: (1) Open System Authentication request and response (Status code 00 = Successful). (2) Association Request detailing client listen interval and capability info, followed by Association Response assigning an Association ID (AID). In WPA2 networks, the 4-way EAPOL key handshake then derives pairwise transient keys (PTK).',
    realWorldAnalogy:
      'Step 1 (Auth): Showing your photo ID to security. Step 2 (Assoc): Receiving an assigned desk number in the office.',
    visualDiagram:
      'Client Station                       ESP32 SoftAP\n      |                                    |\n      |--- 802.11 Auth Request (Seq 1) --->|\n      |<-- 802.11 Auth Response (Seq 2) ---|  [Authenticated]\n      |                                    |\n      |--- Association Request ----------->|\n      |<-- Association Response (AID #1) --|  [Associated]',
    practicalExperiment:
      'Test Experiment 5 in the Guided Experiments tab: enter an incorrect password to see authentication fail at this stage.',
    questions: [
      {
        question: 'Can a client associate with an AP before authenticating?',
        answer: 'No. The 802.11 state machine requires authentication (State 2) before association (State 3).',
      },
      {
        question: 'What does AID stand for in an Association Response?',
        answer: 'Association Identifier, a 16-bit number assigned by the AP to identify the client station.',
      },
      {
        question: 'What status code indicates a successful association?',
        answer: 'Status code 0 (0x0000 - Successful).',
      },
    ],
    relatedControls: 'Network Inspector -> Client Connection State.',
  },
  {
    id: 8,
    title: 'DHCP and IP address assignment',
    category: 'IP Networking',
    simpleExplanation:
      'Being connected to Wi-Fi is like being plugged into a cable, but you still need an address to send letters! DHCP automatically hands out unique IP addresses to every connected client using four steps: DISCOVER, OFFER, REQUEST, ACK (D-O-R-A).',
    technicalExplanation:
      'Dynamic Host Configuration Protocol (DHCP) operates over UDP (Client port 68, Server port 67). Sequence: (1) DHCPDISCOVER broadcast (src 0.0.0.0, dst 255.255.255.255). (2) DHCPOFFER from SoftAP offering an IP from pool. (3) DHCPREQUEST from client accepting IP. (4) DHCPACK committing lease to memory table.',
    realWorldAnalogy:
      'DORA: Discover ("I need an apartment!"), Offer ("Apartment 2B is vacant"), Request ("I would like apartment 2B please"), ACK ("Here is the key to 2B!").',
    visualDiagram:
      'Client (0.0.0.0)                     ESP32 DHCP (192.168.4.1)\n      |                                         |\n      |--- DHCP Discover (UDP 68->67) --------->|\n      |<-- DHCP Offer (192.168.4.2) ------------|\n      |--- DHCP Request (192.168.4.2) --------->|\n      |<-- DHCP ACK (Lease committed) ----------|',
    practicalExperiment:
      'Toggle "DHCP Enabled" off in the AP Config panel and connect a client: observe the client associates but has no IP address!',
    questions: [
      {
        question: 'What does the acronym DORA stand for in DHCP?',
        answer: 'Discover, Offer, Request, Acknowledge.',
      },
      {
        question: 'What UDP ports are used by DHCP client and server?',
        answer: 'UDP Port 68 for Client, UDP Port 67 for Server.',
      },
      {
        question: 'What is the default IP address handed out to the first client on an ESP32?',
        answer: '192.168.4.2.',
      },
    ],
    relatedControls: 'Configuration Panel -> DHCP Toggle & Subnet Pool.',
  },
  {
    id: 9,
    title: 'Subnet masks and gateway addresses',
    category: 'IP Networking',
    simpleExplanation:
      'A subnet mask tells devices which part of the IP address belongs to the local neighborhood (network) and which part belongs to the specific device (host). The gateway is the door out to other networks.',
    technicalExplanation:
      'A subnet mask like 255.255.255.0 (/24) uses the first 24 bits for network routing and the last 8 bits for host addressing (254 usable hosts: .1 through .254). The gateway IP (192.168.4.1) is the ESP32 network interface. Devices on 192.168.4.x communicate directly via ARP without a router hop.',
    realWorldAnalogy:
      'Subnet: Your street name. Host IP: Your house number. Gateway: The highway on-ramp at the end of your street.',
    visualDiagram:
      'IP Address:   192  .  168  .    4  .    2\nSubnet Mask:  255  .  255  .  255  .    0\n             [----- Network ID -----] [Host ID]',
    practicalExperiment:
      'Inspect the Network Inspector tab: notice the AP IP (192.168.4.1) serves as the default gateway for client 192.168.4.2.',
    questions: [
      {
        question: 'In 255.255.255.0, how many bits represent the subnet?',
        answer: '24 bits (hence CIDR notation /24).',
      },
      {
        question: 'Why can 192.168.4.2 and 192.168.4.1 talk to each other directly?',
        answer: 'Because their bitwise AND with the subnet mask yields the identical network ID (192.168.4.0).',
      },
      {
        question: 'What happens if a client is manually assigned 10.0.0.5 on this network?',
        answer: 'Communication fails because 10.0.0.5 is outside the 192.168.4.0/24 subnet.',
      },
    ],
    relatedControls: 'Client Device Details -> Manual IP Configuration.',
  },
  {
    id: 10,
    title: 'Client-to-ESP32 communication',
    category: 'IP Networking',
    simpleExplanation:
      'Once connected with an IP address, the client and ESP32 can send data back and forth! You can send ping tests or commands like "LED_ON", and the ESP32 firmware executes the command and answers back.',
    technicalExplanation:
      'Data transmission encapsulates application payloads into TCP or UDP datagrams over IPv4. In the ESP32 Arduino framework, libraries like `WiFiServer`, `WebServer`, or `AsyncTCP` listen on ports (such as port 80 for HTTP or port 8080 for raw sockets) and execute callback routines.',
    realWorldAnalogy:
      'Sending a text message to your friend and getting an instant reply back.',
    visualDiagram:
      '[Smartphone: 192.168.4.2] --- "HELLO ESP32" (Port 80) ---> [ESP32: 192.168.4.1]\n[Smartphone: 192.168.4.2] <-- "HELLO CLIENT" (Response) <-- [ESP32: 192.168.4.1]',
    practicalExperiment:
      'In the Simulation Lab, click "Ping AP" or "Send Message: HELLO ESP32" and watch the packet travel across the link in real time.',
    questions: [
      {
        question: 'What protocol does the "Ping" command use?',
        answer: 'ICMP (Internet Control Message Protocol) Echo Request (Type 8) and Echo Reply (Type 0).',
      },
      {
        question: 'Does communication require the ESP32 to have internet access?',
        answer: 'No. Local socket communication happens entirely within the local private Wi-Fi network.',
      },
      {
        question: 'What metric measures the delay of a round-trip message?',
        answer: 'Round-Trip Time (RTT), typically measured in milliseconds (ms).',
      },
    ],
    relatedControls: 'Data Communication Simulator -> Ping AP & Send Message.',
  },
  {
    id: 11,
    title: 'Wi-Fi frames versus IP packets',
    category: 'Wi-Fi Protocol',
    simpleExplanation:
      'Wi-Fi frames and IP packets are different layers of the networking cake. Wi-Fi frames handle the invisible radio link between antennas. IP packets live inside the Wi-Fi frame and carry the actual message from software program to software program.',
    technicalExplanation:
      'Layer 2 (Data Link): 802.11 MAC frames with 802.11 headers (Frame Control, Duration, BSSID, Source MAC, Destination MAC). Layer 3 (Network): IPv4 packet headers (Source IP, Destination IP, TTL, Protocol). Layer 4 (Transport): TCP/UDP headers. Layer 7 (Application): HTTP, MQTT, or custom ASCII payloads.',
    realWorldAnalogy:
      'An IP packet is like a letter with an address written on it. The 802.11 Wi-Fi frame is the mail carrier truck driving down the street carrying that letter.',
    visualDiagram:
      '+--------------------------------------------------------------------------+\n| 802.11 MAC Frame Header (BSSID, MAC Src, MAC Dst, Sequence, FCS)         |\n|   +--------------------------------------------------------------------+ |\n|   | IPv4 Packet Header (Src IP: 192.168.4.2, Dst IP: 192.168.4.1, TTL) | |\n|   |   +--------------------------------------------------------------+ | |\n|   |   | UDP / TCP Segment (Port 80)                                  | | |\n|   |   |   +--------------------------------------------------------+ | | |\n|   |   |   | Application Payload: "HELLO ESP32"                     | | | |\n|   |   |   +--------------------------------------------------------+ | | |\n|   |   +--------------------------------------------------------------+ | |\n|   +--------------------------------------------------------------------+ |\n+--------------------------------------------------------------------------+',
    practicalExperiment:
      'Open the "Packet Explorer" tab. Compare a "WIFI_MANAGEMENT" Beacon frame with a "NETWORK_IP" DHCP frame.',
    questions: [
      {
        question: 'At which OSI layer do 802.11 Beacon frames operate?',
        answer: 'Layer 2 (Data Link / MAC Layer).',
      },
      {
        question: 'Can an 802.11 Beacon frame have an IP address?',
        answer: 'No. Management frames do not contain IP headers; they use 48-bit MAC addresses.',
      },
      {
        question: 'What protocol encapsulates DHCP messages?',
        answer: 'UDP (User Datagram Protocol) inside IPv4 packets.',
      },
    ],
    relatedControls: 'Packet Explorer -> Protocol filter dropdown.',
  },
  {
    id: 12,
    title: 'Common connection errors',
    category: 'Firmware & Debugging',
    simpleExplanation:
      'When Wi-Fi fails, it usually happens for one of five reasons: wrong password, AP turned off, too many devices connected, DHCP turned off without a static IP, or being out of radio range.',
    technicalExplanation:
      'Common 802.11/lwIP failure modes: (1) WPA2 4-Way Handshake Key Mismatch -> 802.11 Deauth Reason 15. (2) Max Stations Exceeded -> Assoc Response Status 17. (3) No Beacon Detected -> Scan Timeout. (4) DHCP NAK / Timeout -> No IP allocated. (5) IP Collision -> Duplicate IP detected via Gratuitous ARP.',
    realWorldAnalogy:
      'Trying to unlock a door with the wrong key (Auth fail), or trying to squeeze 5 people into a 4-seater car (Max stations limit).',
    visualDiagram:
      'ERROR MODES:\n[Wrong Password]      --> 802.11 Authentication Denied\n[AP Turned Off]       --> Probe Request Times Out (No Beacon)\n[Max Clients Reached] --> Association Status 17 (Table Full)\n[DHCP Disabled]       --> Associated at L2, but 0.0.0.0 IP (No Ping)',
    practicalExperiment:
      'Try Experiment 6 in the Guided Experiments tab to see the exact status code 17 returned when exceeding max clients.',
    questions: [
      {
        question: 'What 802.11 status code indicates maximum station capacity has been reached?',
        answer: 'Status Code 17 (AP unable to handle additional associated stations).',
      },
      {
        question: 'If a client enters the wrong WPA2 password, does it associate with the network?',
        answer: 'No, it is rejected during authentication before association is granted.',
      },
      {
        question: 'What happens when a client has a valid Wi-Fi link but no IP address?',
        answer: 'It cannot route IP packets, meaning Ping and Web requests will fail with "No route to host".',
      },
    ],
    relatedControls: 'Serial Monitor -> Watch error logs in red.',
  },
  {
    id: 13,
    title: 'Arduino firmware walkthrough',
    category: 'Firmware & Debugging',
    simpleExplanation:
      'In Arduino code, creating an Access Point takes only three lines! You include the WiFi library, set the mode to AP, and call WiFi.softAP(ssid, password).',
    technicalExplanation:
      'The Arduino-ESP32 core wraps Espressif ESP-IDF calls into the high-level `WiFiClass`. `WiFi.mode(WIFI_AP)` calls `esp_wifi_set_mode()`. `WiFi.softAP(ssid, pass, channel, hidden, max_connection)` initializes the SoftAP network interface netif, starts the DHCP server daemon, and binds the radio.',
    realWorldAnalogy:
      'Like setting up an open Wi-Fi hotspot in your phone settings with a simple toggle switch.',
    visualDiagram:
      '#include <WiFi.h>                      // Import Wi-Fi drivers\n\nvoid setup() {\n  Serial.begin(115200);                 // Start serial monitor\n  WiFi.mode(WIFI_AP);                   // Set AP mode\n  WiFi.softAP("MY_SSID", "mypassword"); // Start SoftAP\n  Serial.println(WiFi.softAPIP());      // Prints 192.168.4.1\n}\n\nvoid loop() {                           // Main execution loop\n  delay(1000);\n}',
    practicalExperiment:
      'Go to the Firmware tab. You can download this exact code as an `.ino` sketch to flash to a physical ESP32 board!',
    questions: [
      {
        question: 'Which header file must be included to use ESP32 Wi-Fi functions?',
        answer: '#include <WiFi.h>',
      },
      {
        question: 'What function retrieves the IP address of the ESP32 SoftAP?',
        answer: 'WiFi.softAPIP()',
      },
      {
        question: 'What function configures custom IP, gateway, and subnet mask?',
        answer: 'WiFi.softAPConfig(local_ip, gateway, subnet)',
      },
    ],
    relatedControls: 'Firmware View tab -> Copy & Download .ino.',
  },
  {
    id: 14,
    title: 'Practical experiments and observations',
    category: 'Firmware & Debugging',
    simpleExplanation:
      'True engineering is learned by running experiments: change settings, observe what happens, break things safely, and see how the system reacts.',
    technicalExplanation:
      'Systematic testing of network corner cases verifies robustness: test association under degraded RSSI, measure DHCP lease renewal periods, observe ARP resolution behavior, and monitor memory heap consumption during high station churn.',
    realWorldAnalogy:
      'A flight simulator where pilots test engine failures in a safe software environment before flying a real airplane.',
    visualDiagram:
      'Form Hypothesis --> Change AP Parameter --> Run Simulation --> Inspect Packets & Serial Logs',
    practicalExperiment:
      'Click the "Guided Experiments" button to step through all 12 hands-on laboratory exercises.',
    questions: [
      {
        question: 'Why is simulation valuable for learning embedded networking?',
        answer: 'It lets students observe invisible radio packets, step through state machines, and induce edge-case faults safely.',
      },
      {
        question: 'What tool inspects raw packets in physical networks?',
        answer: 'Wireshark with a Wi-Fi adapter capable of Monitor Mode.',
      },
      {
        question: 'What baud rate is standard for the ESP32 serial console?',
        answer: '115200 baud.',
      },
    ],
    relatedControls: 'Guided Experiments section.',
  },
];
