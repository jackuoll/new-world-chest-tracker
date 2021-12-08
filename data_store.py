import datetime
import json
from typing import List, Any, Dict, Tuple

import requests

from data.models import PlayerData, LootHistory
from data.utils import get_json, write_json
from models import Marker, Location


class Data:
    def __init__(self, player_name: str) -> None:
        self.player_obj, _ = PlayerData.objects.get_or_create(player_name=player_name)  # type: Tuple[PlayerData, Any]
        self._markers: Dict[str, Marker] = None
        self._recent_chest_data = None
        self._last_player_location = None
        self._total_chests_opened = self.total_chests_opened
        self._current_player_location = None

    @property
    def total_chests_opened(self) -> int:
        return self.player_obj.chests_looted

    def increment_total_chests(self) -> None:
        self.player_obj.chests_looted += 1

    def fetch_markers(self) -> None:
        print("fetching markers...")
        self._markers = {}
        marker_req = get_json("data/markers.json")
        if marker_req is None:
            marker_req = requests.get("https://aeternum-map.gg/api/markers").json()
            write_json(marker_req, "data/markers.json")
        for marker in marker_req:
            self._markers[marker["_id"]] = Marker(**marker)
        print("fetched markers")

    @property
    def markers(self):
        if self._markers is None:
            self.fetch_markers()
        return self._markers

    def set_current_player_location(self, location: Location) -> None:
        self._current_player_location = location
        self.player_obj.current_location = location.json()

    def set_last_player_location(self, location: Location) -> None:
        self._last_player_location = location
        self.player_obj.last_location = location.json()

    def is_nearby(self, loc1: Location, loc2: Location) -> bool:
        return abs(loc1.x - loc2.x) < 3 and abs(loc1.y - loc2.y) < 3

    def is_entering(self, loc: Location, poi: Location) -> bool:
        if self._last_player_location is None:
            return False
        player_loc = self._last_player_location
        player_was_in_range = self.is_nearby(player_loc, poi)
        player_in_range = self.is_nearby(loc, poi)
        if not player_was_in_range and player_in_range:
            return True
        return False

    @property
    def recent_chest_data(self) -> dict:
        return LootHistory.objects.filter(reset_time__gt=datetime.datetime.now())

    def is_chest_reset(self, chest_id) -> datetime.timedelta:
        loot_history_obj = self.recent_chest_data.filter(chest_id=chest_id).first()
        if loot_history_obj is None:
            return datetime.timedelta(seconds=0)
        return datetime.timedelta(seconds=(loot_history_obj.reset_time - datetime.datetime.now()).seconds)

    def mark_chest_used(self, chest_id, respawn_time=60 * 60) -> datetime.timedelta:
        resets_at = self.is_chest_reset(chest_id)
        if resets_at > datetime.timedelta(seconds=0):
            return resets_at
        self.increment_total_chests()
        self.add_to_history(chest_id, respawn_time)
        return resets_at

    def nearby_pois(self) -> dict:
        nearby = {}
        nearby_list = []
        if self._current_player_location is None:
            self.player_obj.nearby = {}
            return {}
        for _, poi in DATA.markers.items():
            if self.is_nearby(self._current_player_location, poi.location):
                info = poi.dict()
                nearby[poi.id] = info
                nearby_list.append(poi)
        print(nearby_list)
        self.player_obj.nearby = json.dumps([poi.dict() for poi in nearby_list])
        return nearby_list

    def add_to_history(self, chest_id, respawn_time):
        history_obj = LootHistory(chest_id=chest_id, reset_time=datetime.datetime.now() + datetime.timedelta(seconds=respawn_time), loot_time=datetime.datetime.now())
        history_obj.save()

    def get_last_24h(self) -> List[dict]:
        one_day_prior = datetime.datetime.now() - datetime.timedelta(hours=24)
        return LootHistory.objects.filter(loot_time__gte=one_day_prior)

    def flush(self):
        # todo: track if there was any change
        self.player_obj.save()


DATA = Data("Nightshark")
