import websockets
import asyncio

from settings import SETTINGS


async def proxy_websocket():
    clients = []

    async def client_connection(ws):
        print(f"client {ws} connected")
        clients.append(ws)
        while True:
            await ws.recv()

    async with websockets.connect(SETTINGS.nw_wss_server_location) as websocket:
        print("connected")
        async with websockets.serve(client_connection, SETTINGS.ws_proxy_server_url, SETTINGS.ws_proxy_server_port):
            print(f"server created at ws://{SETTINGS.ws_proxy_server_url}:{SETTINGS.ws_proxy_server_port}")
            while True:
                data = await websocket.recv()
                for client in clients:
                    await client.send(data)


while True:
    try:
        asyncio.run(proxy_websocket())
    except ConnectionRefusedError:
        print("no new world websocket available")
    except websockets.exceptions.ConnectionClosedOK:
        print("client disconnected")
    except websockets.exceptions.ConnectionClosedError:
        print("disconnected from new world websocket")
