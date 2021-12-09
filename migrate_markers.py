import hashlib
import json
from uuid import uuid4

from data.models import Marker
from data.utils import get_json
from models import Location

marker_data = get_json("../../nw_mini.json")
naming_data = get_json("../../nw_mini_naming.json")
to_create = []

old_markers = [
    "chestsLargeSupplies",  
    "chestsLargeAncient",
    "chestsLargeProvisions",
    "chestsLargeAlchemy",
    "chestsMediumSupplies",
    "chestsEliteAncient",
    "chestsEliteSupplies",
    "chestsCommonProvisions",
    "chestsCommonSupplies",
    "chestsCommonAncient",
    "chestsMediumProvisions",
    "chestsMediumAncient",
    "chestsMediumAlchemy"
]

Marker.objects.filter(type__in=old_markers).update(is_deleted=True)

for naming_id, chest_dict in marker_data["chests"].items():
    name_info = naming_data[naming_id]
    marker_dict = {}
    for chest_key, chest_info in chest_dict.items():
        x = chest_info["x"]
        y = chest_info["y"]
        loc = Location(x=y, y=x)
        obj = {
            "zone": loc.get_zone(),
            "type": name_info["sub_category"],
            "unreachable": False,
            "name": name_info["name"],
            "location_x": y,
            "location_y": x,
        }
        marker_id = hashlib.md5(json.dumps(obj).encode()).hexdigest()
        obj.update({"marker_id": marker_id})
        if marker_id in marker_dict:
            continue
        marker_dict.update({
            marker_id: obj
        })
        to_create.append(obj)


Marker.objects.bulk_create([Marker(**marker) for marker in to_create])
