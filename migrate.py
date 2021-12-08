import datetime

from data.models import LootHistory
from data.utils import get_json
from data_store import DATA

# migrate history from file
lh = get_json("data/history.json")
for loot in lh:
    chest_id = loot["chest_id"]
    markers = DATA.markers
    looted_at = datetime.datetime.fromtimestamp(loot["time"])
    chest_info = markers[chest_id]
    is_elite = "Elite" in chest_info.type
    reset = 60 * 60 * 23 if is_elite else 60 * 60
    resets_at = looted_at + datetime.timedelta(seconds=reset)
    lh = LootHistory(chest_id=chest_id, loot_time=looted_at, reset_time=resets_at)
    lh.save()


# migrate player info
chests = get_json("data/total_chests")
print(chests)
DATA.player_obj.chests_looted = int(chests)
DATA.player_obj.save()
