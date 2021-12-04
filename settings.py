from pydantic import BaseSettings


class Settings(BaseSettings):
    ws_proxy_server_url: str = "localhost"
    ws_proxy_server_port: int = 8765
    nw_wss_server_location: str = "wss://localhost.newworldminimap.com:42224/Location"

    class Config:
        env_file = '.env'


SETTINGS = Settings()
