import serial
import asyncio
import websockets
from time import sleep
import signal



class CAN:
    def __init__(self, id='/dev/ttyACM0', baud=115200):
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
            request = await websocket.recv()
            can_data = can.read(request) # read CAN data
            #can_data = can.read()
            can_data = can_data[:-5] # remove the '\r\n' from data
            can_data = can_data[2:]
            await websocket.send(can_data) # send CAN data to react app
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