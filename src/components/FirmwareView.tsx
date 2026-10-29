import React, { useState } from 'react';
import {
  Code,
  Copy,
  Download,
  Check,
  RotateCcw,
  BookOpen,
  Cpu,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { NetworkConfiguration } from '../types/simulation';

interface FirmwareViewProps {
  config: NetworkConfiguration;
}

export const FirmwareView: React.FC<FirmwareViewProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<'basic' | 'advanced'>('basic');

  const basicCode = `/**
 * ESP32 Wi-Fi SoftAP Mode - Reference Firmware
 * Board: ESP32 DevKit V1 (ESP-WROOM-32)
 * Framework: Arduino ESP32 Core
 */

#include <WiFi.h>

// Wi-Fi Access Point Credentials
const char* ssid     = "${config.ssid}";
const char* password = "${config.security === 'OPEN' ? '' : config.password}";

// Optional: Custom IP Configuration
IPAddress local_ip(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

void setup() {
  // 1. Initialize UART serial console for debug logging
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n--- Starting ESP32 Wi-Fi SoftAP ---");

  // 2. Set Wi-Fi radio mode explicitly to SoftAP (not Station)
  WiFi.mode(WIFI_AP);

  // 3. Configure custom IP addresses for the SoftAP interface
  WiFi.softAPConfig(local_ip, gateway, subnet);

  // 4. Start the SoftAP with SSID, Password, Channel, Hidden, and Max Connections
  // softAP(ssid, passphrase, channel, ssid_hidden, max_connection)
  bool apStarted = WiFi.softAP(
    ssid,
    ${config.security === 'OPEN' ? 'NULL' : 'password'},
    ${config.channel},  // Wi-Fi Channel
    0,   // 0 = Broadcast SSID, 1 = Hidden SSID
    ${config.maxClients}    // Max connected stations (1 to 8)
  );

  if (apStarted) {
    Serial.println("[SUCCESS] Access Point initialized.");
    Serial.print("SoftAP SSID: ");
    Serial.println(ssid);
    Serial.print("SoftAP IP Address: ");
    Serial.println(WiFi.softAPIP());
  } else {
    Serial.println("[ERROR] Failed to start SoftAP.");
  }
}

void loop() {
  // Query and print current number of connected client stations every 5 seconds
  static uint8_t lastStationCount = 255;
  uint8_t currentCount = WiFi.softAPgetStationNum();

  if (currentCount != lastStationCount) {
    Serial.print("[STATUS] Stations connected to ESP32: ");
    Serial.println(currentCount);
    lastStationCount = currentCount;
  }

  delay(1000);
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(basicCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([basicCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esp32_softap_${config.ssid.toLowerCase()}.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 text-slate-800 rounded-md">
              <Code className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">ESP32 Arduino Firmware Code</h2>
              <p className="text-xs text-slate-500">
                Production-ready C++ sketch dynamically tailored with your current simulation configuration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Code'}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .ino Sketch
            </button>
          </div>
        </div>

        {/* Code Editor Preview Window */}
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-200 border border-slate-800 shadow-inner">
          <pre className="leading-relaxed">
            <code>{basicCode}</code>
          </pre>
        </div>
      </div>

      {/* Function-by-Function Educational Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-sky-600" />
          Key API Functions &amp; Architecture Walkthrough
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-mono font-bold text-sky-700">#include &lt;WiFi.h&gt;</span>
            <p className="text-slate-600 leading-relaxed">
              Provides the official Espressif Arduino Wi-Fi driver library. It interfaces with the underlying
              FreeRTOS lwIP TCP/IP stack and controls the 2.4GHz RF baseband transceiver.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-mono font-bold text-sky-700">WiFi.mode(WIFI_AP)</span>
            <p className="text-slate-600 leading-relaxed">
              Switches the hardware MAC engine into Access Point mode. Other valid modes include{' '}
              <code className="text-slate-900 font-semibold">WIFI_STA</code> (Station/Client) and{' '}
              <code className="text-slate-900 font-semibold">WIFI_AP_STA</code> (Concurrent AP + Client).
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-mono font-bold text-sky-700">WiFi.softAPConfig(...)</span>
            <p className="text-slate-600 leading-relaxed">
              Overrides the default <code className="text-slate-900">192.168.4.1</code> IP address. Must
              be called <em>before</em> <code className="text-slate-900">WiFi.softAP()</code> to configure custom
              static IP, default gateway, and subnet mask.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-mono font-bold text-sky-700">WiFi.softAP(...)</span>
            <p className="text-slate-600 leading-relaxed">
              Starts the software access point. Parameters: SSID name, WPA2 pre-shared key, 2.4GHz RF channel (1–13),
              hidden SSID flag (0/1), and max allowed concurrent station connections (1–8).
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-mono font-bold text-sky-700">WiFi.softAPIP()</span>
            <p className="text-slate-600 leading-relaxed">
              Returns an <code className="text-slate-900">IPAddress</code> object containing the actual assigned
              local IPv4 address of the SoftAP interface on the local network.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-mono font-bold text-sky-700">WiFi.softAPgetStationNum()</span>
            <p className="text-slate-600 leading-relaxed">
              Queries the ESP32 station table and returns the count of currently associated Wi-Fi client stations.
            </p>
          </div>
        </div>
      </div>

      {/* Flashing Instructions for Arduino IDE */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-700">
        <h3 className="font-semibold text-slate-900 text-sm mb-2">How to Upload to a Physical ESP32 Board</h3>
        <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-600">
          <li>Install the latest <strong>Arduino IDE</strong> (v2.x or later).</li>
          <li>
            Go to <em>Tools &rarr; Board &rarr; Boards Manager</em> and install{' '}
            <code className="text-slate-900 font-mono">esp32 by Espressif Systems</code>.
          </li>
          <li>Select your specific board: <strong>ESP32 Dev Module</strong> or <strong>NodeMCU-32S</strong>.</li>
          <li>Connect your physical ESP32 board using a micro-USB or USB-C data cable.</li>
          <li>Select the correct COM port (e.g., <code className="text-slate-900 font-mono">COM3</code> or <code className="text-slate-900 font-mono">/dev/ttyUSB0</code>).</li>
          <li>Click the <strong>Upload</strong> button (Arrow icon).</li>
          <li>Open the Serial Monitor at <strong>115200 baud</strong> to observe AP startup and connected stations!</li>
        </ol>
      </div>
    </div>
  );
};
