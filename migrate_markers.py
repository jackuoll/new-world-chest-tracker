from data.models import Marker
from data import chest_alias_list
from data.utils import get_json
from models import Location

j = get_json("data/markers.json")
for marker_data in j:
    loc_raw = marker_data["position"]
    loc = Location(x=loc_raw[1], y=loc_raw[0])
    id = marker_data["_id"]
    extra_info = chest_alias_list.get(id)
    name = marker_data.get("name", "unknown")
    unreachable = False
    if extra_info:
        name = extra_info["name"]
        unreachable = extra_info.get("unreachable", False)

    m = Marker(
        marker_id=id,
        name=name,
        zone=loc.get_zone(),
        type=marker_data["type"],
        unreachable=unreachable,
        location_x=loc.x,
        location_y=loc.y
    )
    m.save()
