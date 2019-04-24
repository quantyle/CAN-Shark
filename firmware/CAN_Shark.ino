#include "src/Sparkfun_Shield_Custom/Canbus.h"
#include "src/Sparkfun_Shield_Custom/defaults.h"
#include "src/Sparkfun_Shield_Custom/global.h"
#include "src/Sparkfun_Shield_Custom/mcp2515.h"
#include "src/Sparkfun_Shield_Custom/mcp2515_defs.h"
#include <ArduinoJson.h>
// Include required libraries
#include <Adafruit_CC3000.h>
#include "utility/debug.h"
#include "utility/socket.h"
#include <SPI.h>

// These are the interrupt and control pins
#define ADAFRUIT_CC3000_IRQ 3 // MUST be an interrupt pin!
// These can be any two pins
#define ADAFRUIT_CC3000_VBAT 5
#define ADAFRUIT_CC3000_CS 10
// Use hardware SPI for the remaining pins
// On an UNO, SCK = 13, MISO = 12, and MOSI = 11

Adafruit_CC3000 cc3000 = Adafruit_CC3000(ADAFRUIT_CC3000_CS, ADAFRUIT_CC3000_IRQ, ADAFRUIT_CC3000_VBAT,
                                         SPI_CLOCK_DIVIDER); // you can change this clock speed

#define WLAN_SSID "TOBI_EXT" // cannot be longer than 32 characters!
#define WLAN_PASS "8658261963"
// Security can be WLAN_SEC_UNSEC, WLAN_SEC_WEP, WLAN_SEC_WPA or WLAN_SEC_WPA2
#define WLAN_SECURITY WLAN_SEC_WPA2

#define LISTEN_PORT 80 // What TCP port to listen on for connections. \
                       // The HTTP protocol uses port 80 by default.

#define MAX_ACTION 10 // Maximum length of the HTTP action that can be parsed.

#define MAX_PATH 64 // Maximum length of the HTTP request path that can be parsed. \
                    // There isn't much memory available so keep this short!

#define BUFFER_SIZE MAX_ACTION + MAX_PATH + 20 // Size of buffer for incoming request data.  \
                                               // Since only the first line is parsed this   \
                                               // needs to be as large as the maximum action \
                                               // and path plus a little for whitespace and  \
                                               // HTTP version.

#define TIMEOUT_MS 500 // Amount of time in milliseconds to wait for     \
                       // an incoming request to finish.  Don't set this \
                       // too high or your server could be slow to respond.

Adafruit_CC3000_Server httpServer(LISTEN_PORT);
uint8_t buffer[BUFFER_SIZE + 1];
int bufindex = 0;
char action[MAX_ACTION + 1];
char path[MAX_PATH + 1];

char UserInput;
int data;
String message;

void setup()
{
  Serial.begin(115200);
  Serial.println(F("Hello, CC3000!\n"));

  Serial.print("Free RAM: ");
  Serial.println(getFreeRam(), DEC);

  // Initialise the module
  Serial.println(F("\nInitializing..."));
  if (!cc3000.begin())
  {
    Serial.println(F("Couldn't begin()! Check your wiring?"));
    while (1)
      ;
  }

  Serial.print(F("\nAttempting to connect to "));
  Serial.println(WLAN_SSID);
  if (!cc3000.connectToAP(WLAN_SSID, WLAN_PASS, WLAN_SECURITY))
  {
    Serial.println(F("Failed!"));
    while (1)
      ;
  }

  Serial.println(F("Connected!"));

  Serial.println(F("Request DHCP"));
  while (!cc3000.checkDHCP())
  {
    delay(100); // ToDo: Insert a DHCP timeout!
  }

  // Display the IP address DNS, Gateway, etc.
  while (!displayConnectionDetails())
  {
    delay(1000);
  }

  // Start listening for connections
  httpServer.begin();

  Serial.println(F("Listening for connections..."));

  if (Canbus.init(CANSPEED_500)) /* Initialise MCP2515 CAN controller at the specified speed */
  {
    Serial.println("{\"status\": \"[ OK ]\"}");
  }
  else
  {
    Serial.println("{\"status\": \"[ ERROR ] Unable to initialize MCP2515 CAN controller\"}");
  }

  delay(1000);
}

void loop()
{
  // Try to get a client which is connected.
  Adafruit_CC3000_ClientRef client = httpServer.available();
  if (client)
  {
    Serial.println(F("Client connected."));
    // Process this request until it completes or times out.
    // Note that this is explicitly limited to handling one request at a time!

    // Clear the incoming data buffer and point to the beginning of it.
    bufindex = 0;
    memset(&buffer, 0, sizeof(buffer));

    // Clear action and path strings.
    memset(&action, 0, sizeof(action));
    memset(&path, 0, sizeof(path));

    // Set a timeout for reading all the incoming data.
    unsigned long endtime = millis() + TIMEOUT_MS;

    // Read all the incoming data until it can be parsed or the timeout expires.
    bool parsed = false;
    while (!parsed && (millis() < endtime) && (bufindex < BUFFER_SIZE))
    {
      if (client.available())
      {
        buffer[bufindex++] = client.read();
      }
      parsed = parseRequest(buffer, bufindex, action, path);
    }

    // Handle the request if it was parsed.
    if (parsed)
    {
      String out = Canbus.ecu_req(5); // read message from can bus
      Serial.println(out);
      char copy[50];
      out.toCharArray(copy, 50);

      Serial.println(F("Processing request"));
      Serial.print(F("Action: "));
      Serial.println(action);
      Serial.print(F("Path: "));
      Serial.println(path);
      // Check the action to see if it was a GET request.
      if (strcmp(action, "GET") == 0)
      {
        // Respond with the path that was accessed.
        // First send the success response code.
        client.fastrprintln(F("HTTP/1.1 200 OK"));
        // Then send a few headers to identify the type of data returned and that
        // the connection will not be held open.
        client.fastrprintln(F("Content-Type: text/plain"));
        client.fastrprintln(F("Connection: close"));
        client.fastrprintln(F("Server: Adafruit CC3000"));
        // Send an empty line to signal start of body.
        client.fastrprintln(F(""));
        // Now send the response data.
        client.fastrprintln(copy);
        client.fastrprint(F("You accessed path: "));
        client.fastrprintln(path);
      }
      else
      {
        // Unsupported action, respond with an HTTP 405 method not allowed error.
        client.fastrprintln(F("HTTP/1.1 405 Method Not Allowed"));
        client.fastrprintln(F(""));
      }
    }

    // Wait a short period to make sure the response had time to send before
    // the connection is closed (the CC3000 sends data asyncronously).
    delay(100);

    // Close the connection when done.
    Serial.println(F("Client disconnected"));
    client.close();
  }
  // while (Serial.available()) // only send data back if data has been received
  // {
  //   char data = Serial.read(); // read incoming bytes
  //   message += String(data);   // concat incoming bytes to message string
  //   if (String(data) == "}") // find end delimiter
  //   {
  //     StaticJsonDocument<456> doc;                                // will hold json data
  //     DeserializationError error = deserializeJson(doc, message); // deserialize json data
  //     delay(30); // rest
  //     int i;
  //     String response = "[";
  //     //Serial.println(message);
  //     for (i = 0; i < sizeof(doc["pids"]); i++)
  //     {
  //       String out = Canbus.ecu_req(doc["pids"][i]); // read message from can bus
  //       if (out == NULL || out == "" || out == " ")
  //       {
  //         response += "\"___\",";
  //         Serial.print(out);
  //       }
  //       else
  //       {
  //         response += out;
  //       }
  //       delay(30); // rest
  //     }
  //     response.remove(response.length() - 1); // remove trailing commas for parser
  //     response += "]";
  //     Serial.println(response); // send message
  //     delay(30);                // allow buffer to fill
  //     message = "";             // clear message
  //   }
  //   Serial.flush(); // move on when serial is clear
  // }
}

// Return true if the buffer contains an HTTP request.  Also returns the request
// path and action strings if the request was parsed.  This does not attempt to
// parse any HTTP headers because there really isn't enough memory to process
// them all.
// HTTP request looks like:
//  [method] [path] [version] \r\n
//  Header_key_1: Header_value_1 \r\n
//  ...
//  Header_key_n: Header_value_n \r\n
//  \r\n
bool parseRequest(uint8_t* buf, int bufSize, char* action, char* path) {
  // Check if the request ends with \r\n to signal end of first line.
  if (bufSize < 2)
    return false;
  if (buf[bufSize-2] == '\r' && buf[bufSize-1] == '\n') {
    parseFirstLine((char*)buf, action, path);
    return true;
  }
  return false;
}

// Parse the action and path from the first line of an HTTP request.
void parseFirstLine(char* line, char* action, char* path) {
  // Parse first word up to whitespace as action.
  char* lineaction = strtok(line, " ");
  if (lineaction != NULL)
    strncpy(action, lineaction, MAX_ACTION);
  // Parse second word up to whitespace as path.
  char* linepath = strtok(NULL, " ");
  if (linepath != NULL)
    strncpy(path, linepath, MAX_PATH);
}

// Tries to read the IP address and other connection details
bool displayConnectionDetails(void)
{
  uint32_t ipAddress, netmask, gateway, dhcpserv, dnsserv;
  
  if(!cc3000.getIPAddress(&ipAddress, &netmask, &gateway, &dhcpserv, &dnsserv))
  {
    Serial.println(F("Unable to retrieve the IP Address!\r\n"));
    return false;
  }
  else
  {
    Serial.print(F("\nIP Addr: ")); cc3000.printIPdotsRev(ipAddress);
    Serial.print(F("\nNetmask: ")); cc3000.printIPdotsRev(netmask);
    Serial.print(F("\nGateway: ")); cc3000.printIPdotsRev(gateway);
    Serial.print(F("\nDHCPsrv: ")); cc3000.printIPdotsRev(dhcpserv);
    Serial.print(F("\nDNSserv: ")); cc3000.printIPdotsRev(dnsserv);
    Serial.println();
    return true;
  }
}
