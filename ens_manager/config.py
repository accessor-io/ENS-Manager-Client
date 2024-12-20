from pathlib import Path
from dotenv import load_dotenv, set_key
import os

class Config:
    # Use lowercase with underscores for consistency
    provider_keys = {
        'infura': 'infura_api_key',
        'alchemy': 'alchemy_api_key',
        'ankr': 'ankr_api_key',
        'moralis': 'moralis_api_key',
        'quicknode': 'quicknode_url',
        'pocket': 'pocket_api_key',
        'nodereal': 'nodereal_api_key',
        'getblock': 'getblock_api_key',
        'rivet': 'rivet_api_key',
        'blast': 'blast_api_key',
        'chainstack': 'chainstack_url'
    }

    def __init__(self):
        self.env_file = Path('.env')
        self.config_dir = Path.home() / '.ens_manager'
        self.ensure_config_dir()
        self.load_config()

    def ensure_config_dir(self):
        """Ensure configuration directory exists"""
        if not self.config_dir.exists():
            self.config_dir.mkdir(parents=True)
        if not self.env_file.exists():
            self.env_file.touch()

    def load_config(self):
        """Load environment variables from .env file"""
        load_dotenv(self.env_file)

    def get_provider_key(self, provider: str) -> str:
        """Get API key for specific provider"""
        env_var = self.provider_keys.get(provider)
        return os.getenv(env_var) if env_var else None

    def set_provider_key(self, provider: str, key: str) -> bool:
        """Set API key for specific provider"""
        env_var = self.provider_keys.get(provider)
        if env_var:
            set_key(self.env_file, env_var, key)
            load_dotenv()
            return True
        return False

    def list_configured_providers(self) -> dict:
        """List all providers that have API keys configured"""
        configured = {}
        for provider, env_var in self.provider_keys.items():
            key = os.getenv(env_var)
            if key:
                configured[provider] = key
        return configured

    def remove_provider_key(self, provider: str) -> bool:
        """Remove API key for specific provider"""
        env_var = self.provider_keys.get(provider)
        if env_var and os.getenv(env_var):
            set_key(self.env_file, env_var, '')
            load_dotenv()
            return True
        return False 