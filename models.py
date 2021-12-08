from __future__ import annotations
from typing import List, Optional

from pydantic import Field, BaseModel, validator, root_validator
from data.utils import get_json
from shapely.geometry import Point
from shapely.geometry.polygon import Polygon

from data import chest_alias_list


class Location(BaseModel):
    x: float  # e/w
    y: float  # n/s

    def get_zone(self) -> str:
        j = get_json("data/region_data.json")
        point = Point(self.location.y, self.location.x)
        for region in j:
            poly_points = j[region]["latlngs"]
            polygon = Polygon(poly_points)
            if polygon.contains(point):
                return region.replace("region_", "").replace("_", " ").title()
        return "Unknown"


class MarkerExtraData(BaseModel):
    zone: str
    name: str
    unreachable: Optional[bool] = False


class Marker(BaseModel):
    id: str = Field(alias="_id")
    type: str
    location: Location = Field(alias="position")
    name_data: str = Field(alias="name", default="unknown")
    extra_data: Optional[MarkerExtraData]

    @validator('location', pre=True)
    def validate(cls, value: List) -> Location:
        return Location(x=value[0], y=value[1])

    @root_validator(pre=True)
    def set_each(cls, values: dict) -> Optional[dict]:  # noqa
        extra_data = chest_alias_list.get(values["_id"])
        if extra_data:
            values.update({"extra_data": extra_data})
        return values

    @property
    def name(self) -> str:
        return self.extra_data.name if self.extra_data else self.id

    @property
    def zone(self) -> str:
        if not self.extra_data:
            region_name = self.location.get_zone()
            self.extra_data = MarkerExtraData(
                name="Unknown",
                zone=region_name,
                unreachable=False
            )
        return self.extra_data.zone if self.extra_data else "Unknown"

    @property
    def unreachable(self) -> str:
        return self.extra_data.unreachable if self.extra_data else False

    @classmethod
    def load(cls) -> List[Marker]:
        pass
