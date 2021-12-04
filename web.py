import json
import time
from datetime import datetime, timedelta

from fastapi import FastAPI
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

from data import chest_alias_list
from data_store import DATA

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


def add_name_to(d) -> dict:
    d["name"] = DATA.markers.get(d["id"], None)
    return d


def timedelta_to_time(td: timedelta):
    # td = 3620 secs
    # mins = 20 secs / 60
    days = int(td.seconds / 60 / 60 / 24)
    hours = int(td.seconds / 60 / 60) % 60
    minutes = int(td.seconds % (60 * 60) / 60)
    seconds = int(td.seconds) % 60
    return f"{days}d {hours}h {minutes}m {seconds}s"


@app.get("/")
async def root():
    with open("data/total_chests") as f:
        total_chests_opened = json.load(f)
    with open("data/recent_chest_data.json") as f, open("data/nearby.json") as chest_f:
        cur_time = time.time()
        data = {
            "opened_last_24h": len(DATA.get_history()),
            "total_opened": total_chests_opened,
            "nearby": {
                k: DATA.markers.get(k).dict() for k, v in json.load(chest_f).items()
            },
            "reset_timers": {
                k: {
                    "name": DATA.markers.get(k).name,
                    "zone": DATA.markers.get(k).zone,
                    "reset": (datetime.now() + timedelta(seconds=v - cur_time)).strftime("%I:%M%p").lower(),
                    "resets_in": timedelta_to_time(timedelta(seconds=v - cur_time))
                }

                for k, v in sorted(json.load(f).items(), key=lambda items: items[1])
                if v > cur_time
            }
        }
        return data


@app.get("/page/")
async def page(request: Request):
    return templates.TemplateResponse("page.html", {"request": request, "id": id})


# notes chest 162 MD bear
# texts chest 168 weavers field 1.5k