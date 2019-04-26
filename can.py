import serial
import asyncio
import websockets
from time import sleep
import signal
import json


class CAN:
    def __init__(self, id='/dev/ttyACM2', baud=115200):
        self.arduino = serial.Serial(id, baud)
    def read(self, msg='\0'):
        self.arduino.write(msg.encode()) 
        ser_bytes = self.arduino.readline()
        ser_bytes = str(ser_bytes)
        sleep(.01) # Delay for 10ms
        return ser_bytes

can = CAN()


async def receiver(websocket, path):
    while True:
        try:
            request = await websocket.recv() # grab request from front-end
            parsed_request = json.loads(request) # create request dictionary
            print(parsed_request)
            if parsed_request["stop"]:
                await websocket.send('{}') # send received CAN data to front-end
            else:
                can_data = can.read(request) # read data from CAN 
                can_data = can_data[:-5] # remove the '\r\n' from data
                can_data = can_data[2:] # remove more garbage
                await websocket.send(can_data) # send received CAN data to front-end
        except websockets.ConnectionClosed:
            print("Connection closed")
            break

async def server(stop):
    async with websockets.serve(receiver, 'localhost', 8765):
        await stop

loop = asyncio.get_event_loop()

stop = asyncio.Future()
loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)

loop.run_until_complete(server(stop))


