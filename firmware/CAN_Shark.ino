/************************************************************************************************* 
  
  Query
  send id: 0x7df
      dta: 0x02, 0x01, PID_CODE, 0, 0, 0, 0, 0

  Response
  From id: 0x7E9 or 0x7EA or 0x7EB
      dta: len, 0x41, PID_CODE, byte0, byte1(option), byte2(option), byte3(option), byte4(option)
      
  https://en.wikipedia.org/wiki/OBD-II_PIDs
  
  Input a PID, then you will get reponse from vehicle, the input should be end with '\n'
***************************************************************************************************/
#include <SPI.h>
#include "src/Seeed_Shield_Custom/mcp_can.h"


// the cs pin of the version after v1.1 is default to D9
// v0.9b and v1.0 is default D10
const int SPI_CS_PIN = 10;

MCP_CAN CAN(SPI_CS_PIN); // Set CS pin

#define PID_ENGIN_PRM 0x0C
#define PID_VEHICLE_SPEED 0x0D
#define PID_COOLANT_TEMP 0x05

#define CAN_ID_PID 0x7DF

unsigned char PID_INPUT;
unsigned char getPid = 0;

void set_mask_filt()
{
    /*
     * set mask, set both the mask to 0x3ff
     */
    CAN.init_Mask(0, 0, 0x7FC);
    CAN.init_Mask(1, 0, 0x7FC);

    /*
     * set filter, we can receive id from 0x04 ~ 0x09
     */
    CAN.init_Filt(0, 0, 0x7E8);
    CAN.init_Filt(1, 0, 0x7E8);

    CAN.init_Filt(2, 0, 0x7E8);
    CAN.init_Filt(3, 0, 0x7E8);
    CAN.init_Filt(4, 0, 0x7E8);
    CAN.init_Filt(5, 0, 0x7E8);
}

void sendPid(unsigned char __pid)
{
    unsigned char tmp[8] = {0x02, 0x01, __pid, 0, 0, 0, 0, 0};
    Serial.print("SEND PID: 0x");
    Serial.println(__pid, HEX);
    CAN.sendMsgBuf(CAN_ID_PID, 0, 8, tmp);
}

void task_can()
{
    unsigned char len = 0;
    unsigned char buf[8];

    if (CAN_MSGAVAIL == CAN.checkReceive()) // check if we received a message
    {
        CAN.readMsgBuf(&len, buf); // read data,  len: data length, buf: data buf

        Serial.println("\r\n---------------------------------------------------");
        Serial.print("Get Data From id: 0x");
        Serial.println(CAN.getCanId(), HEX);
        for (int i = 0; i < len; i++) // print the data
        {
            Serial.print("0x");
            Serial.print(buf[i], HEX);
            Serial.print("\t");
        }
        Serial.println();
    }
}

void task_serial()
{
    while (Serial.available())
    {
        char c = Serial.read();

        if (c >= '0' && c <= '9')
        {
            PID_INPUT *= 0x10;
            PID_INPUT += c - '0';
        }
        else if (c >= 'A' && c <= 'F')
        {
            PID_INPUT *= 0x10;
            PID_INPUT += 10 + c - 'A';
        }
        else if (c >= 'a' && c <= 'f')
        {
            PID_INPUT *= 0x10;
            PID_INPUT += 10 + c - 'a';
        }
        else if (c == '\n') // END
        {
            getPid = 1;
        }
        Serial.println("char");
    }
}

void setup()
{
    Serial.begin(115200);
    while (CAN_OK != CAN.begin(CAN_500KBPS)) // wait for CAN bus init with baudrate = 500k
    {
        delay(100);
    }
    Serial.println("CAN BUS Shield init ok!");
    set_mask_filt();
}

void loop()
{
    task_can();
    task_serial();

    if (getPid) // GET A PID
    {
        getPid = 0;
        sendPid(PID_INPUT);
        PID_INPUT = 0;
    }
}