import datetime
import json
import time
from typing import List, Any, Dict

import requests

from models import Marker, Location


class Data:
    def __init__(self) -> None:
        self._markers: Dict[str, Marker] = None
        self._recent_chest_data = None
        self._last_player_location = None
        self._total_chests_opened = self.load_total_chests_opened()
        self._current_player_location = None

    def load_total_chests_opened(self) -> int:
        fn = "data/total_chests"

        try:
            with open(fn) as f:
                total_chests_opened = json.load(f)
        except FileNotFoundError:
            total_chests_opened = 71
        return total_chests_opened

    def increment_total_chests(self) -> None:
        self._total_chests_opened += 1
        print(f"now opened {self._total_chests_opened} chests")
        with open("data/total_chests", "w") as f:
            json.dump(self._total_chests_opened, f)

    def get_json(self, filename: str) -> Any:
        try:
            with open(filename) as f:
                return json.load(f)
        except FileNotFoundError:
            pass
        return None

    def write_json(self, j: Any, filename: str) -> None:
        with open(filename, "w") as f:
            json.dump(j, f)

    def fetch_markers(self) -> None:
        print("fetching markers...")
        self._markers = {}
        marker_req = self.get_json("data/markers.json")
        if marker_req is None:
            marker_req = requests.get("https://aeternum-map.gg/api/markers").json()
            with open("data/markers.json", "w") as f:
                json.dump(marker_req, f)
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

    def set_last_player_location(self, location: Location) -> None:
        self._last_player_location = location

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
        if self._recent_chest_data:
            return self._recent_chest_data
        recent_chest_data = self.get_json("data/recent_chest_data.json")
        if recent_chest_data is None:
            t = time.time()
            interested_types = ["chestsLargeSupplies", "chestsLargeAncient"]
            recent_chest_data = {
                marker.id: t for marker in self.markers
                if marker.type in interested_types
            }
            self.write_json(recent_chest_data, "data/recent_chest_data.json")

        self._recent_chest_data = recent_chest_data
        return recent_chest_data

    def is_chest_reset(self, chest_id) -> datetime.timedelta:
        rcd = self.recent_chest_data
        chest_respawns_at = rcd.get(chest_id, 0)
        respawns_in_seconds = chest_respawns_at - time.time()
        if respawns_in_seconds < 0:
            return datetime.timedelta(seconds=0)
        return datetime.timedelta(seconds=respawns_in_seconds)

    def mark_chest_used(self, chest_id, respawn_time=60 * 60) -> datetime.timedelta:
        resets_at = self.is_chest_reset(chest_id)
        if resets_at > datetime.timedelta(seconds=0):
            return resets_at
        rcd = self.recent_chest_data
        self.increment_total_chests()
        rcd[chest_id] = time.time() + respawn_time
        self.add_to_history(chest_id)
        with open("data/recent_chest_data.json", "w") as f:
            json.dump(rcd, f, indent=2)
        return resets_at

    def nearby_pois(self) -> dict:
        nearby = {}
        nearby_list = []
        if self._current_player_location is None:
            return {}
        for _, poi in DATA.markers.items():
            if self.is_nearby(self._current_player_location, poi.location):
                info = poi.dict()
                nearby[poi.id] = info
                nearby_list.append(poi)
        self.write_json(nearby, "data/nearby.json")
        return nearby_list

    def add_to_history(self, chest_id):
        history = self.get_json("data/history.json") or []
        history.append({"chest_id": chest_id, "time": time.time()})
        self.write_json(history, "data/history.json")

    def get_history(self) -> List[dict]:
        return self.get_json("data/history.json") or []



DATA = Data()
