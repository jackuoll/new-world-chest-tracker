from __future__ import annotations
from typing import List, Optional

from pydantic import Field, BaseModel, validator, root_validator

from data import chest_alias_list


class Location(BaseModel):
    x: float  # e/w
    y: float  # n/s


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
        return self.extra_data.zone if self.extra_data else "Unknown"

    @property
    def unreachable(self) -> str:
        return self.extra_data.unreachable if self.extra_data else False

    @classmethod
    def load(cls) -> List[Marker]:
        pass
