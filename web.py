import json
from datetime import datetime, timedelta

from fastapi import FastAPI, Body
from pydantic import BaseModel
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

from data.models import Marker, LootHistory, PlayerData
from settings import SETTINGS

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


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
    player = PlayerData.objects.get(player_name="Nightshark")
    total_chests_opened = LootHistory.objects.count()
    reset_timers = LootHistory.recent_loot()
    nearby = player.nearby_markers
    cur_time = datetime.now()
    loc = player.location
    data = {
        "opened_last_24h": len(LootHistory.get_last_24h()),
        "total_opened": total_chests_opened,
        "zone": loc.get_zone(),
        "nearby": {
            p.marker_id: {k: v for k, v in p.__dict__.items() if not k.startswith("_")} for p in nearby
        },
        "reset_timers": {
            "elites": {
                chest.chest_id: {
                    "name": chest.chest.name,
                    "zone": chest.chest.location.get_zone(),
                    "reset": chest.reset_time.strftime("%I:%M%p").lower(),
                    "resets_in": timedelta_to_time(chest.reset_time - cur_time)
                }
                for chest in reset_timers
                if chest.is_elite
            },
            "stockpiles": {
                chest.chest_id: {
                    "name": chest.chest.name,
                    "zone": chest.chest.location.get_zone(),
                    "reset": chest.reset_time.strftime("%I:%M%p").lower(),
                    "resets_in": timedelta_to_time(chest.reset_time - cur_time)
                }
                for chest in reset_timers
                if not chest.is_elite
            }
        }
    }
    return data


def is_self(request: Request) -> bool:
    print(request.client.host,  SETTINGS.my_ip)
    return request.client.host == SETTINGS.my_ip


@app.get("/")
def page(request: Request) -> templates.TemplateResponse:
    return templates.TemplateResponse("page.html", {"request": request, "id": id, "repos": is_self(request)})


@app.patch("/set_marker_location/{marker_id}/")
def set_market_loc(request: Request, marker_id: str) -> JSONResponse:
    if not is_self(request):
        return JSONResponse(content={"status": "forbidden"}, status_code=500)

    player = PlayerData.objects.get(player_name="Nightshark")
    cur_loc = player.location
    med = Marker.objects.get(marker_id=marker_id)
    med.location_x = cur_loc.x
    med.location_y = cur_loc.y
    med.save()
    return JSONResponse(content={"status": "ok"}, status_code=200)


class NewNameData(BaseModel):
    new_name: str


@app.patch("/set_marker_name/{marker_id}/")
def set_marker_name(request: Request, marker_id: str, data: NewNameData) -> JSONResponse:
    if not is_self(request):
        return JSONResponse(content={"status": "forbidden"}, status_code=500)

    med = Marker.objects.get(marker_id=marker_id)
    med.name = data.new_name
    med.save()
    return JSONResponse(content={"status": "ok"}, status_code=200)
