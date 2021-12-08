import json
from typing import Any


def get_json(filename: str) -> Any:
    try:
        with open(filename) as f:
            return json.load(f)
    except FileNotFoundError:
        pass
    return None


def write_json(j: Any, filename: str, indent: int = 0) -> None:
    with open(filename, "w") as f:
        json.dump(j, f, indent=indent)
