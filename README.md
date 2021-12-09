# new-world-chest-tracker

Application to track chest cooldowns in the New World MMORPG. Currently tracks Supply Stockpiles, Ancient Chests (elite and non elite).

### Requirements:
* Mysql (could change the DB engine to sqlite and probably would not have any issues)
* New World Mini Map (Overwolf extension - provides websocket to hook player location)

Requires use of the New World Mini Map Overwolf addon, as this provides a websocket to hook player location, which is used to track when the player comes in range of a known chest location.

### How to run

* Install the pip requirements
* Run `main.py` script to hook the player location. This script will write data to the DB about chests looted, player position, etc.
* Run the webserver with `uvicorn web:app --reload`

Optionally there is a script to proxy the NW Minimap websocket if you wish to run this on a PC different to the one you are playing on.
