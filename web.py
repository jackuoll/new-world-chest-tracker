import json
import time
from datetime import datetime, timedelta

from fastapi import FastAPI
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


def add_name_to(d) -> dict:
    from data_store import DATA
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


@app.get("/data/")
def root():
    from data_store import DATA
    total_chests_opened = DATA.total_chests_opened
    reset_timers = DATA.recent_chest_data
    with open("data/recent_chest_data.json") as f, open("data/nearby.json") as chest_f:
        cur_time = datetime.now()
        data = {
            "opened_last_24h": len(DATA.get_last_24h()),
            "total_opened": total_chests_opened,
            "nearby": {
                k: DATA.markers.get(k).dict() for k, v in json.load(chest_f).items()
            },
            "reset_timers": {
                chest.chest_id: {
                    "name": DATA.markers.get(chest.chest_id).name,
                    "zone": DATA.markers.get(chest.chest_id).zone,
                    "reset": chest.reset_time.strftime("%I:%M%p").lower(),
                    "resets_in": timedelta_to_time(chest.reset_time - cur_time)
                }

                for chest in reset_timers
            }
        }
        return data


@app.get("/")
def page(request: Request):
    return templates.TemplateResponse("page.html", {"request": request, "id": id})


# 614f0374519d9fd5eba646ec