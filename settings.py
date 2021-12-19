from pydantic import BaseSettings


class Settings(BaseSettings):
    my_ip: str = "127.0.0.1"  # some budget security
    db_name: str = "nw_dev"
    db_host: str = "192.168.0.11"
    db_user: str = "nw"
    db_pass: str = "password"
    ws_proxy_server_url: str = "192.168.0.10"
    ws_proxy_server_port: int = 8765
    nw_wss_server_location: str = "wss://localhost.newworldminimap.com:42224/Location"
    interested_marker_names = [
        "Supply Stockpile", "Supply Stockpile (Elite)", "Ancient Chest (Elite)", "Ancient Chest"
    ]

    class Config:
        env_file = '.env'


SETTINGS = Settings()
