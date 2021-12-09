import asyncio
import json
import logging
import time

import websockets

from data.models import PlayerData, LootHistory
from models import Location

from settings import SETTINGS
from asgiref.sync import sync_to_async


PLAYER = PlayerData.objects.get(player_name="Nightshark")
print(PLAYER)


def handle_position_update(event):
    loc_arr = event["position"]
    loc = Location(y=loc_arr[0], x=loc_arr[1])
    PLAYER.update_location(loc)
    markers = PLAYER.nearby_markers
    interested_types = ["Provisions Stockpile", "Ancient Chest (Elite)", "Ancient Chest"]
    for poi in markers:
        is_chest = poi.type in interested_types
        if poi.location.is_entering(PLAYER.old_location, PLAYER.location) and not poi.unreachable:
            is_elite = "Elite" in poi.name
            if is_chest:
                lh = LootHistory.mark_looted(poi.marker_id, 60 * 60 * 23 if is_elite else 60 * 60)
                print(f"Approach - {poi.type}, {poi.name} - resets: {lh.resets.total_seconds()}")
            else:
                print(f"Approach - {poi.type}, {poi.name}")
    PLAYER.save()


async def connect_to_websocket():
    async with websockets.connect(SETTINGS.nw_wss_server_location) as websocket:
        print("connected")
        while True:
            data = await websocket.recv()
            event = json.loads(data)
            if event["type"] != "LOCAL_POSITION_UPDATE":
                logging.warning(f"dunno what {event} is")
            else:
                h = sync_to_async(handle_position_update)
                await h(event)


while True:
    try:
        asyncio.run(connect_to_websocket())
    except (ConnectionRefusedError, asyncio.exceptions.TimeoutError):
        pass
    except (websockets.exceptions.ConnectionClosedError, websockets.exceptions.ConnectionClosedOK):
        print("disconnected")
    time.sleep(1)
