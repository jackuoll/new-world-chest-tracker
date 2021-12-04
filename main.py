import asyncio
import json
import logging
import time

import websockets
from models import Location

from data_store import DATA
from data import chest_alias_list


def handle_position_update(event):
    loc_arr = event["position"]
    loc = Location(x=loc_arr[0], y=loc_arr[1])
    interested_types = ["chestsLargeSupplies", "chestsLargeAncient"]
    DATA.set_current_player_location(loc)
    nearby_pois = DATA.nearby_pois()
    for poi in nearby_pois:
        if poi.type not in interested_types:
            continue
        if DATA.is_entering(loc, poi.location):
            resets = DATA.mark_chest_used(poi.id)
            name = chest_alias_list.get(poi.id, poi.id)
            print(f"Approach - {poi.type}, {name} - resets: {resets.total_seconds()}")

    DATA.set_last_player_location(loc)


async def connect_to_websocket():
    async with websockets.connect("wss://localhost.newworldminimap.com:42224/Location") as websocket:
        print("connected")
        while True:
            data = await websocket.recv()
            event = json.loads(data)
            if event["type"] != "LOCAL_POSITION_UPDATE":
                logging.warning(f"dunno what {event} is")
            else:
                handle_position_update(event)


while True:
    try:
        asyncio.run(connect_to_websocket())
    except ConnectionRefusedError:
        pass
    except websockets.exceptions.ConnectionClosedError:
        print("disconnected")
    time.sleep(1)


# async def echo(websocket):
#     async for message in websocket:
#         print(message)
#         await websocket.send(message)
#
# async def main():
#     async with websockets.serve(echo, "0.0.0.0", 8765):
#         await asyncio.Future()  # run forever

# asyncio.run(main())
