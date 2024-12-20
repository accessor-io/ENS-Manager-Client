import os
from dotenv import load_dotenv

class Config:
    def __init__(self):
        self.eth_provider_url = os.getenv('ETH_PROVIDER_URL')
        self.load_config()

    def load_config(self):
        # Load from .env if exists
        load_dotenv()
        
    def set_provider_url(self, url):
        self.eth_provider_url = url
        # Optionally save to .env
        with open('.env', 'a') as f:
            f.write(f'\nETH_PROVIDER_URL={url}')

    def has_provider(self):
        return bool(self.eth_provider_url) 