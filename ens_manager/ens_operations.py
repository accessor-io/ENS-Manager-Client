"""Core ENS operations module with global resolution support."""

import asyncio
from typing import Dict, List, Optional, Union, Any, Tuple
from web3 import Web3
from eth_utils import is_address, to_checksum_address, decode_hex
from web3.middleware import geth_poa_middleware
from ens import ENS
import os
from dotenv import load_dotenv
import json
from datetime import datetime, timezone
from rich.console import Console
import base64
import codecs
import time
from pathlib import Path
import aiohttp

# ENS Registry ABI for the required functions
ENS_REGISTRY_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "node", "type": "bytes32"},
            {"indexed": True, "name": "owner", "type": "address"}
        ],
        "name": "NewOwner",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "node", "type": "bytes32"},
            {"indexed": False, "name": "owner", "type": "address"}
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "constant": True,
        "inputs": [{"name": "node", "type": "bytes32"}],
        "name": "ttl",
        "outputs": [{"name": "", "type": "uint64"}],
        "payable": False,
        "type": "function"
    }
]

# ENS Registry address (same on all networks)
ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"

# ENS Public Resolver ABI
ENS_RESOLVER_ABI = [
    {
        "inputs": [{"name": "node", "type": "bytes32"}, {"name": "addr", "type": "address"}],
        "name": "setAddr",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "node", "type": "bytes32"}, {"name": "key", "type": "string"}, {"name": "value", "type": "string"}],
        "name": "setText",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

# ENS Controller ABI for registration
ENS_CONTROLLER_ABI = [
    {
        "inputs": [
            {"name": "name", "type": "string"},
            {"name": "owner", "type": "address"},
            {"name": "duration", "type": "uint256"},
            {"name": "secret", "type": "bytes32"}
        ],
        "name": "register",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"name": "name", "type": "string"}, {"name": "duration", "type": "uint256"}],
        "name": "rentPrice",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "name", "type": "string"}],
        "name": "available",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# ENS Controller address (mainnet)
ENS_CONTROLLER_ADDRESS = "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5"

console = Console()

# Network configurations
NETWORK_CONFIGS = {
    'mainnet': {
        'chain_id': 1,
        'name': 'Ethereum Mainnet',
        'rpc_env_var': 'ETH_MAINNET_RPC',
        'explorer': 'https://etherscan.io'
    },
    'optimism': {
        'chain_id': 10,
        'name': 'Optimism',
        'rpc_env_var': 'OPTIMISM_RPC',
        'explorer': 'https://optimistic.etherscan.io'
    },
    'arbitrum': {
        'chain_id': 42161,
        'name': 'Arbitrum One',
        'rpc_env_var': 'ARBITRUM_RPC',
        'explorer': 'https://arbiscan.io'
    },
    'polygon': {
        'chain_id': 137,
        'name': 'Polygon',
        'rpc_env_var': 'POLYGON_RPC',
        'explorer': 'https://polygonscan.com'
    },
    'base': {
        'chain_id': 8453,
        'name': 'Base',
        'rpc_env_var': 'BASE_RPC',
        'explorer': 'https://basescan.org'
    }
}

# Add CCIP-Read interface
CCIP_READ_INTERFACE = {
    'name': 'CCIP-Read',
    'type': 'function',
    'stateMutability': 'view',
    'inputs': [
        {'name': 'name', 'type': 'string'},
        {'name': 'data', 'type': 'bytes'}
    ],
    'outputs': [
        {'name': 'result', 'type': 'bytes'}
    ]
}

class NetworkManager:
    """Manage connections to different EVM networks."""
    
    def __init__(self):
        """Initialize network connections."""
        self.connections = {}
        self.current_network = 'mainnet'
        
        # Initialize connections for each network
        for network, config in NETWORK_CONFIGS.items():
            rpc_url = os.getenv(config['rpc_env_var'])
            if rpc_url:
                try:
                    web3 = Web3(Web3.HTTPProvider(rpc_url))
                    if web3.is_connected():
                        self.connections[network] = web3
                except Exception as e:
                    print(f"Failed to connect to {network}: {e}")
    
    def get_web3(self, network: str = None) -> Optional[Web3]:
        """Get Web3 instance for specified network."""
        if network is None:
            network = self.current_network
        return self.connections.get(network)
    
    def set_current_network(self, network: str) -> bool:
        """Set the current network."""
        if network in self.connections:
            self.current_network = network
            return True
        return False
    
    def get_available_networks(self) -> List[str]:
        """Get list of available networks."""
        return list(self.connections.keys())

class CrossNetworkResolver:
    """Handle cross-network ENS resolution."""
    
    def __init__(self, network_manager: NetworkManager):
        """Initialize resolver."""
        self.network_manager = network_manager
        self.mainnet_web3 = network_manager.get_web3('mainnet')
    
    def get_network_specific_address(self, name: str, network: str) -> Optional[str]:
        """Get network-specific resolution for an ENS name."""
        try:
            # First check if there's a network-specific record
            resolver = self.mainnet_web3.ens.resolver(name)
            if resolver:
                try:
                    # Try to get network-specific address from text record
                    network_key = f"network.{network}.address"
                    network_address = resolver.functions.text(
                        self.mainnet_web3.ens.namehash(name),
                        network_key
                    ).call()
                    if network_address and is_address(network_address):
                        return to_checksum_address(network_address)
                except Exception:
                    pass
            
            # If no network-specific record, fall back to default resolution
            if network == 'mainnet':
                return self.mainnet_web3.ens.address(name)
                
            return None
        except Exception as e:
            print(f"Error resolving {name} on {network}: {e}")
            return None
    
    def set_network_address(self, name: str, network: str, address: str) -> Tuple[bool, str]:
        """Set network-specific address for an ENS name."""
        try:
            if not is_address(address):
                return False, "Invalid address"
                
            resolver = self.mainnet_web3.ens.resolver(name)
            if not resolver:
                return False, "No resolver set"
            
            # Set network-specific address in text record
            network_key = f"network.{network}.address"
            tx = resolver.functions.setText(
                self.mainnet_web3.ens.namehash(name),
                network_key,
                address
            ).build_transaction({
                'from': self.mainnet_web3.eth.default_account,
                'nonce': self.mainnet_web3.eth.get_transaction_count(
                    self.mainnet_web3.eth.default_account
                )
            })
            
            signed_tx = self.mainnet_web3.eth.account.sign_transaction(
                tx, 
                private_key=os.getenv('ETH_PRIVATE_KEY')
            )
            tx_hash = self.mainnet_web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.mainnet_web3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                return True, f"Successfully set {network} address for {name}"
            return False, "Transaction failed"
            
        except Exception as e:
            return False, f"Error setting address: {str(e)}"
    
    def get_all_network_addresses(self, name: str) -> Dict[str, Optional[str]]:
        """Get all network-specific addresses for an ENS name."""
        results = {}
        for network in NETWORK_CONFIGS.keys():
            address = self.get_network_specific_address(name, network)
            results[network] = address
        return results
    
    def validate_network_setup(self, name: str) -> List[str]:
        """Validate network setup for an ENS name."""
        issues = []
        resolver = self.mainnet_web3.ens.resolver(name)
        
        if not resolver:
            issues.append("No resolver set")
            return issues
        
        # Check resolver interface support
        try:
            supports_text = resolver.functions.supportsInterface(
                self.mainnet_web3.keccak(text='text(bytes32,string)')[:4]
            ).call()
            if not supports_text:
                issues.append("Resolver doesn't support text records")
        except Exception:
            issues.append("Cannot verify resolver interface support")
        
        # Check network records
        for network in NETWORK_CONFIGS.keys():
            try:
                network_key = f"network.{network}.address"
                address = resolver.functions.text(
                    self.mainnet_web3.ens.namehash(name),
                    network_key
                ).call()
                
                if address and not is_address(address):
                    issues.append(f"Invalid address format for {network}")
            except Exception:
                pass
        
        return issues

class ENSActivity:
    """Class to handle ENS activity tracking and export."""
    
    def __init__(self, export_dir: str = "ens_activity"):
        """Initialize activity tracker."""
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(parents=True, exist_ok=True)
        self.current_activities = {}
    
    def add_activity(self, name: str, event_type: str, data: dict):
        """Add new activity for a name."""
        timestamp = datetime.now(timezone.utc)
        
        if name not in self.current_activities:
            self.current_activities[name] = []
            
        activity = {
            'timestamp': timestamp.isoformat(),
            'type': event_type,
            'data': data
        }
        
        self.current_activities[name].append(activity)
        self._export_activity(name, activity)
    
    def _export_activity(self, name: str, activity: dict):
        """Export activity to JSON file."""
        # Create name-specific directory
        name_dir = self.export_dir / name.replace('.', '_')
        name_dir.mkdir(exist_ok=True)
        
        # Daily file for activities
        date_str = datetime.now().strftime('%Y-%m-%d')
        file_path = name_dir / f"activity_{date_str}.json"
        
        try:
            if file_path.exists():
                with open(file_path, 'r') as f:
                    activities = json.load(f)
            else:
                activities = []
            
            activities.append(activity)
            
            with open(file_path, 'w') as f:
                json.dump(activities, f, indent=2)
                
        except Exception as e:
            print(f"Error exporting activity: {e}")
    
    def get_activities(self, name: str, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[dict]:
        """Get activities for a name within date range."""
        activities = []
        name_dir = self.export_dir / name.replace('.', '_')
        
        if not name_dir.exists():
            return activities
            
        for file_path in sorted(name_dir.glob("activity_*.json")):
            try:
                with open(file_path, 'r') as f:
                    daily_activities = json.load(f)
                    
                for activity in daily_activities:
                    activity_time = datetime.fromisoformat(activity['timestamp'])
                    
                    if start_date and activity_time < start_date:
                        continue
                    if end_date and activity_time > end_date:
                        continue
                        
                    activities.append(activity)
                    
            except Exception as e:
                print(f"Error reading activities from {file_path}: {e}")
                
        return activities

class GlobalResolver:
    """Handle global ENS resolution across networks."""
    
    def __init__(self, network_manager: NetworkManager):
        """Initialize global resolver."""
        self.network_manager = network_manager
        self.mainnet_web3 = network_manager.get_web3('mainnet')
        
        # Cache for resolution results
        self.resolution_cache = {}
        self.cache_duration = 300  # 5 minutes
        
    async def resolve_globally(self, name: str) -> Dict[str, Any]:
        """Resolve ENS name globally across all networks."""
        try:
            # Check cache first
            cache_key = f"{name}_global"
            if cache_key in self.resolution_cache:
                cached_data, timestamp = self.resolution_cache[cache_key]
                if time.time() - timestamp < self.cache_duration:
                    return cached_data
            
            # Get the resolver contract
            resolver = self.mainnet_web3.ens.resolver(name)
            if not resolver:
                return {'error': 'No resolver set'}
            
            # Check if resolver supports CCIP-Read
            supports_ccip = resolver.functions.supportsInterface(
                self.mainnet_web3.keccak(text='resolve(bytes,bytes)')[:4]
            ).call()
            
            results = {
                'name': name,
                'supports_ccip': supports_ccip,
                'resolutions': {},
                'metadata': {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'resolver_address': resolver.address
                }
            }
            
            # Get resolutions for each network
            tasks = []
            for network in self.network_manager.get_available_networks():
                tasks.append(self._resolve_on_network(name, network, resolver, supports_ccip))
            
            network_results = await asyncio.gather(*tasks)
            for network, result in zip(self.network_manager.get_available_networks(), network_results):
                results['resolutions'][network] = result
            
            # Cache the results
            self.resolution_cache[cache_key] = (results, time.time())
            
            return results
            
        except Exception as e:
            return {'error': str(e)}
    
    async def _resolve_on_network(self, name: str, network: str, resolver: Any, supports_ccip: bool) -> Dict[str, Any]:
        """Resolve name on a specific network."""
        try:
            web3 = self.network_manager.get_web3(network)
            if not web3:
                return {'error': 'Network not available'}
            
            result = {
                'address': None,
                'resolution_type': None,
                'metadata': {}
            }
            
            # Try network-specific resolution first
            try:
                network_key = f"network.{network}.address"
                network_address = resolver.functions.text(
                    self.mainnet_web3.ens.namehash(name),
                    network_key
                ).call()
                
                if network_address and is_address(network_address):
                    result.update({
                        'address': to_checksum_address(network_address),
                        'resolution_type': 'network_specific',
                        'metadata': {
                            'source': 'text_record',
                            'key': network_key
                        }
                    })
                    return result
            except Exception:
                pass
            
            # Try CCIP-Read if supported
            if supports_ccip:
                try:
                    encoded_name = self.mainnet_web3.ens.namehash(name)
                    resolver_contract = web3.eth.contract(
                        address=resolver.address,
                        abi=[CCIP_READ_INTERFACE]
                    )
                    
                    # Prepare CCIP-Read call data
                    call_data = web3.eth.abi.encode_abi(
                        ['bytes32', 'string'],
                        [encoded_name, network]
                    )
                    
                    response = await resolver_contract.functions.resolve(
                        encoded_name,
                        call_data
                    ).call()
                    
                    if response:
                        decoded = web3.eth.abi.decode_abi(['address'], response)[0]
                        result.update({
                            'address': to_checksum_address(decoded),
                            'resolution_type': 'ccip_read',
                            'metadata': {
                                'source': 'ccip_read',
                                'resolver': resolver.address
                            }
                        })
                        return result
                except Exception as e:
                    result['metadata']['ccip_error'] = str(e)
            
            # Fallback to mainnet resolution for L2s
            if network != 'mainnet':
                mainnet_address = self.mainnet_web3.ens.address(name)
                if mainnet_address:
                    result.update({
                        'address': mainnet_address,
                        'resolution_type': 'mainnet_fallback',
                        'metadata': {
                            'source': 'mainnet_resolution'
                        }
                    })
            
            return result
            
        except Exception as e:
            return {'error': str(e)}
    
    async def verify_resolution(self, name: str, network: str) -> Dict[str, Any]:
        """Verify resolution consistency on a specific network."""
        try:
            result = {
                'name': name,
                'network': network,
                'checks': []
            }
            
            # Get resolver
            resolver = self.mainnet_web3.ens.resolver(name)
            if not resolver:
                result['checks'].append({
                    'type': 'resolver_check',
                    'status': 'failed',
                    'message': 'No resolver set'
                })
                return result
            
            # Check resolver interface support
            supports_ccip = resolver.functions.supportsInterface(
                self.mainnet_web3.keccak(text='resolve(bytes,bytes)')[:4]
            ).call()
            
            result['checks'].append({
                'type': 'ccip_support',
                'status': 'passed' if supports_ccip else 'warning',
                'message': 'CCIP-Read supported' if supports_ccip else 'CCIP-Read not supported'
            })
            
            # Get and verify network-specific resolution
            network_key = f"network.{network}.address"
            try:
                network_address = resolver.functions.text(
                    self.mainnet_web3.ens.namehash(name),
                    network_key
                ).call()
                
                if network_address:
                    if is_address(network_address):
                        result['checks'].append({
                            'type': 'network_resolution',
                            'status': 'passed',
                            'message': f'Valid network-specific address: {network_address}'
                        })
                    else:
                        result['checks'].append({
                            'type': 'network_resolution',
                            'status': 'failed',
                            'message': 'Invalid network-specific address format'
                        })
            except Exception as e:
                result['checks'].append({
                    'type': 'network_resolution',
                    'status': 'error',
                    'message': f'Error checking network resolution: {str(e)}'
                })
            
            # Verify CCIP-Read resolution if supported
            if supports_ccip:
                try:
                    web3 = self.network_manager.get_web3(network)
                    encoded_name = self.mainnet_web3.ens.namehash(name)
                    resolver_contract = web3.eth.contract(
                        address=resolver.address,
                        abi=[CCIP_READ_INTERFACE]
                    )
                    
                    call_data = web3.eth.abi.encode_abi(
                        ['bytes32', 'string'],
                        [encoded_name, network]
                    )
                    
                    response = await resolver_contract.functions.resolve(
                        encoded_name,
                        call_data
                    ).call()
                    
                    if response:
                        result['checks'].append({
                            'type': 'ccip_resolution',
                            'status': 'passed',
                            'message': 'CCIP-Read resolution successful'
                        })
                    else:
                        result['checks'].append({
                            'type': 'ccip_resolution',
                            'status': 'warning',
                            'message': 'No CCIP-Read resolution result'
                        })
                except Exception as e:
                    result['checks'].append({
                        'type': 'ccip_resolution',
                        'status': 'error',
                        'message': f'CCIP-Read resolution error: {str(e)}'
                    })
            
            return result
            
        except Exception as e:
            return {
                'name': name,
                'network': network,
                'error': str(e)
            }

class ENSManager:
    """Manages ENS operations."""
    
    def __init__(self, provider_url: Optional[str] = None, private_key: Optional[str] = None):
        """Initialize ENS Manager."""
        if not provider_url:
            provider_url = os.getenv('ETH_MAINNET_RPC', 'https://eth-mainnet.g.alchemy.com/v2/your-api-key')
        
        self.w3 = Web3(Web3.HTTPProvider(provider_url))
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Ensure ENS is properly initialized
        if not hasattr(self.w3, 'ens'):
            from ens import ENS
            self.w3.ens = ENS.from_web3(self.w3)
        
        if private_key:
            account = self.w3.eth.account.from_key(private_key)
            self.w3.eth.default_account = account.address
        
        self.network_manager = NetworkManager()
        self.cross_resolver = CrossNetworkResolver(self.network_manager)
        self.global_resolver = GlobalResolver(self.network_manager)
        
        # Initialize ENS registry contract
        self.registry = self.w3.eth.contract(
            address=ENS_REGISTRY_ADDRESS,
            abi=ENS_REGISTRY_ABI
        )
        
        # Set up ENS resolver
        self.resolver = self.w3.eth.contract(
            abi=ENS_RESOLVER_ABI
        )
        
        # Set up ENS controller
        self.controller = self.w3.eth.contract(
            address=ENS_CONTROLLER_ADDRESS,
            abi=ENS_CONTROLLER_ABI
        )
    
    def resolve_name(self, name: str, network: Optional[str] = None) -> Optional[str]:
        """Resolve ENS name to address on specified network."""
        try:
            if network is None:
                network = self.network_manager.current_network
            
            # First try network-specific resolution
            address = self.cross_resolver.get_network_specific_address(name, network)
            if address:
                return address
            
            # If on mainnet or no network-specific resolution, try default resolution
            if network == 'mainnet':
                try:
                    # Use Web3's ENS resolution
                    address = self.w3.ens.address(name)
                    if address and address != "0x0000000000000000000000000000000000000000":
                        return address
                except Exception as e:
                    print(f"Error in mainnet resolution: {e}")
            
            return None
        except Exception as e:
            print(f"Error resolving name {name}: {e}")
            return None

    def reverse_resolve(self, address: str) -> Optional[str]:
        """Reverse resolve address to ENS name."""
        try:
            if not is_address(address):
                return None
            return self.w3.ens.name(address)
        except Exception as e:
            print(f"Error reverse resolving: {e}")
            return None

    def set_network_resolution(self, name: str, network: str, address: str) -> Tuple[bool, str]:
        """Set network-specific resolution for an ENS name."""
        return self.cross_resolver.set_network_address(name, network, address)
    
    def get_all_resolutions(self, name: str) -> Dict[str, Optional[str]]:
        """Get all network resolutions for an ENS name."""
        return self.cross_resolver.get_all_network_addresses(name)
    
    def validate_network_setup(self, name: str) -> List[str]:
        """Validate network configuration for an ENS name."""
        return self.cross_resolver.validate_network_setup(name)
    
    def get_available_networks(self) -> List[str]:
        """Get list of available networks."""
        return self.network_manager.get_available_networks()
    
    def set_network(self, network: str) -> bool:
        """Set current network for operations."""
        return self.network_manager.set_current_network(network)

    def get_owner(self, name: str) -> Optional[str]:
        """Get owner of ENS name."""
        try:
            owner = self.w3.ens.owner(name)
            return owner if owner != "0x0000000000000000000000000000000000000000" else None
        except Exception as e:
            print(f"Error getting owner of {name}: {e}")
            return None

    def get_resolver(self, name: str) -> Optional[str]:
        """Get resolver contract address for ENS name."""
        try:
            resolver = self.w3.ens.resolver(name)
            return resolver.address if resolver else None
        except Exception as e:
            print(f"Error getting resolver for {name}: {e}")
            return None

    def get_ttl(self, name: str) -> Optional[int]:
        """Get TTL for ENS name."""
        try:
            node = self.w3.ens.namehash(name)
            ttl = self.registry.functions.ttl(node).call()
            return ttl
        except Exception as e:
            print(f"Error getting TTL for {name}: {e}")
            return None

    def get_text_record(self, name: str, key: str) -> Optional[str]:
        """Get text record for ENS name."""
        try:
            resolver = self.w3.ens.resolver(name)
            if not resolver:
                return None
            return resolver.functions.text(self.w3.ens.namehash(name), key).call()
        except Exception as e:
            print(f"Error getting text record for {name}: {e}")
            return None

    def get_content_hash(self, name: str) -> Optional[str]:
        """Get content hash for ENS name."""
        try:
            resolver = self.w3.ens.resolver(name)
            if not resolver:
                return None
            
            content_hash = resolver.functions.contenthash(self.w3.ens.namehash(name)).call()
            
            if not content_hash:
                return None
                
            # Decode the content hash
            if len(content_hash) == 0:
                return None
                
            # Convert to hex string
            content_hash_hex = '0x' + content_hash.hex()
            
            # Handle IPFS hashes (0xe3010170 prefix)
            if content_hash_hex.startswith('0xe3010170'):
                # Remove the IPFS prefix and encode as base58
                ipfs_bytes = content_hash[4:]
                import base58
                return f"ipfs://{base58.b58encode(ipfs_bytes).decode('utf-8')}"
            
            # Handle Swarm hashes (0xe40101fa prefix)
            elif content_hash_hex.startswith('0xe40101fa'):
                swarm_bytes = content_hash[4:]
                return f"bzz://{swarm_bytes.hex()}"
                
            return content_hash_hex
            
        except Exception as e:
            print(f"Error getting content hash for {name}: {e}")
            return None

    def set_address(self, name: str, address: str) -> bool:
        """Set address for ENS name."""
        if not self.account:
            raise ValueError("Private key required for this operation")
            
        try:
            if not is_address(address):
                return False
                
            address = to_checksum_address(address)
            tx = self.w3.ens.setup_address(name, address)
            return bool(tx)
        except Exception as e:
            print(f"Error setting address for {name}: {e}")
            return False

    def set_text_record(self, name: str, key: str, value: str) -> bool:
        """Set text record for ENS name."""
        if not self.account:
            raise ValueError("Private key required for this operation")
            
        try:
            resolver = self.w3.ens.resolver(name)
            if not resolver:
                return False
                
            tx = resolver.functions.setText(
                self.w3.ens.namehash(name),
                key,
                value
            ).transact({'from': self.account.address})
            return bool(tx)
        except Exception as e:
            print(f"Error setting text record for {name}: {e}")
            return False

    def set_content_hash(self, name: str, content_hash: str) -> bool:
        """Set content hash for ENS name."""
        if not self.account:
            raise ValueError("Private key required for this operation")
            
        try:
            resolver = self.w3.ens.resolver(name)
            if not resolver:
                return False
                
            tx = resolver.functions.setContenthash(
                self.w3.ens.namehash(name),
                content_hash
            ).transact({'from': self.account.address})
            return bool(tx)
        except Exception as e:
            print(f"Error setting content hash for {name}: {e}")
            return False

    async def batch_resolve(self, names: List[str]) -> Dict[str, Optional[str]]:
        """Resolve multiple ENS names in parallel."""
        tasks = [self.resolve_name(name) for name in names]
        results = await asyncio.gather(*tasks)
        return dict(zip(names, results))

    async def batch_reverse_resolve(self, addresses: List[str]) -> Dict[str, Optional[str]]:
        """Reverse resolve multiple addresses in parallel."""
        tasks = [self.reverse_resolve(addr) for addr in addresses]
        results = await asyncio.gather(*tasks)
        return dict(zip(addresses, results))

    def validate_name(self, name: str) -> bool:
        """Validate ENS name format."""
        try:
            # Basic validation rules
            if not name or len(name) < 3:
                return False
                
            # Must contain at least one dot
            if '.' not in name:
                return False
                
            # Check TLD
            tld = name.split('.')[-1]
            if tld not in ['eth', 'xyz', 'test']:  # Add more valid TLDs as needed
                return False
                
            # Check characters
            allowed = set('abcdefghijklmnopqrstuvwxyz0123456789-.')
            if not set(name.lower()).issubset(allowed):
                return False
                
            # No consecutive dots or hyphens
            if '..' in name or '--' in name:
                return False
                
            # No leading/trailing dots or hyphens
            if name.startswith('.') or name.endswith('.') or \
               name.startswith('-') or name.endswith('-'):
                return False
                
            return True
        except Exception:
            return False

    def get_registration_status(self, name: str) -> Dict[str, Any]:
        """Get detailed registration status."""
        try:
            owner = self.get_owner(name)
            resolver = self.get_resolver(name)
            address = self.resolve_name(name)
            
            return {
                'name': name,
                'available': not bool(owner),
                'owner': owner,
                'resolver': resolver,
                'address': address,
                'valid': self.validate_name(name)
            }
        except Exception as e:
            print(f"Error getting registration status for {name}: {e}")
            return {
                'name': name,
                'error': str(e)
            }

    def get_primary_name(self, address: str) -> Optional[str]:
        """Get primary ENS name for an address."""
        try:
            if not is_address(address):
                return None
                
            address = to_checksum_address(address)
            return self.w3.ens.name(address)
        except Exception as e:
            print(f"Error getting primary name for {address}: {e}")
            return None

    def get_name_history(self, name: str) -> List[Dict[str, Any]]:
        """Get ownership history of an ENS name."""
        try:
            node = self.w3.ens.namehash(name)
            
            # Get the latest block number
            latest_block = self.w3.eth.block_number
            
            # Get Transfer events
            transfer_filter = self.registry.events.Transfer.create_filter(
                fromBlock=0,
                toBlock=latest_block,
                argument_filters={'node': node}
            )
            transfer_events = transfer_filter.get_all_entries()
            
            # Get NewOwner events
            new_owner_filter = self.registry.events.NewOwner.create_filter(
                fromBlock=0,
                toBlock=latest_block,
                argument_filters={'node': node}
            )
            new_owner_events = new_owner_filter.get_all_entries()
            
            # Combine and sort events
            events = []
            
            for event in transfer_events:
                block = self.w3.eth.get_block(event['blockNumber'])
                events.append({
                    'type': 'Transfer',
                    'from': event['args']['owner'],
                    'to': None,  # Will be filled from next event
                    'timestamp': datetime.fromtimestamp(block['timestamp']).isoformat(),
                    'block': event['blockNumber'],
                    'transaction': event['transactionHash'].hex()
                })
            
            for event in new_owner_events:
                block = self.w3.eth.get_block(event['blockNumber'])
                events.append({
                    'type': 'NewOwner',
                    'owner': event['args']['owner'],
                    'timestamp': datetime.fromtimestamp(block['timestamp']).isoformat(),
                    'block': event['blockNumber'],
                    'transaction': event['transactionHash'].hex()
                })
            
            # Sort by block number
            events.sort(key=lambda x: x['block'])
            
            # Fill in 'to' addresses for Transfer events
            for i in range(len(events) - 1):
                if events[i]['type'] == 'Transfer':
                    next_owner = None
                    for j in range(i + 1, len(events)):
                        if events[j]['type'] == 'NewOwner':
                            next_owner = events[j]['owner']
                            break
                    events[i]['to'] = next_owner
            
            return events
        except Exception as e:
            print(f"Error getting history for {name}: {e}")
            return []

    def check_name_available(self, name: str) -> bool:
        """Check if an ENS name is available for registration."""
        try:
            # Remove .eth suffix if present
            name = name.lower().replace('.eth', '')
            return self.controller.functions.available(name).call()
        except Exception as e:
            print(f"Error checking availability for {name}: {e}")
            return False

    def get_registration_cost(self, name: str, duration_years: int = 1) -> Optional[float]:
        """Get the cost in ETH to register a name."""
        try:
            # Remove .eth suffix if present
            name = name.lower().replace('.eth', '')
            duration = duration_years * 31536000  # Convert years to seconds
            wei_cost = self.controller.functions.rentPrice(name, duration).call()
            eth_cost = self.w3.from_wei(wei_cost, 'ether')
            return float(eth_cost)
        except Exception as e:
            print(f"Error getting registration cost for {name}: {e}")
            return None

    def register_name(self, name: str, duration_years: int = 1) -> Tuple[bool, str]:
        """Register an ENS name."""
        if not self.account:
            return False, "No account configured"

        try:
            # Remove .eth suffix if present
            name = name.lower().replace('.eth', '')
            
            # Check availability
            if not self.check_name_available(name):
                return False, "Name is not available"
            
            # Calculate duration and cost
            duration = duration_years * 31536000  # Convert years to seconds
            wei_cost = self.controller.functions.rentPrice(name, duration).call()
            
            # Generate random secret
            secret = os.urandom(32)
            
            # Build transaction
            transaction = self.controller.functions.register(
                name,
                self.account.address,
                duration,
                secret
            ).build_transaction({
                'from': self.account.address,
                'value': wei_cost,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 300000,  # Estimated gas limit
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction to be mined
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                return True, f"Successfully registered {name}.eth"
            else:
                return False, "Transaction failed"
                
        except Exception as e:
            return False, f"Error registering name: {str(e)}"

    def transfer_name(self, name: str, to_address: str) -> Tuple[bool, str]:
        """Transfer an ENS name to another address."""
        if not self.account:
            return False, "No account configured"

        try:
            # Verify the target address
            if not is_address(to_address):
                return False, "Invalid target address"
            
            to_address = to_checksum_address(to_address)
            
            # Check ownership
            current_owner = self.get_owner(name)
            if not current_owner or current_owner.lower() != self.account.address.lower():
                return False, "You don't own this name"
            
            # Get namehash
            node = self.w3.ens.namehash(name)
            
            # Build transaction
            transaction = self.registry.functions.setOwner(
                node,
                to_address
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 100000,  # Estimated gas limit
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction to be mined
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                return True, f"Successfully transferred {name} to {to_address}"
            else:
                return False, "Transaction failed"
                
        except Exception as e:
            return False, f"Error transferring name: {str(e)}"

    def set_address(self, name: str, address: str) -> Tuple[bool, str]:
        """Set the address that an ENS name resolves to."""
        if not self.account:
            return False, "No account configured"

        try:
            # Verify the target address
            if not is_address(address):
                return False, "Invalid target address"
            
            address = to_checksum_address(address)
            
            # Check ownership
            current_owner = self.get_owner(name)
            if not current_owner or current_owner.lower() != self.account.address.lower():
                return False, "You don't own this name"
            
            # Get resolver
            resolver = self.w3.ens.resolver(name)
            if not resolver:
                return False, "No resolver set for this name"
            
            # Get namehash
            node = self.w3.ens.namehash(name)
            
            # Build transaction
            transaction = resolver.functions.setAddr(
                node,
                address
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 100000,  # Estimated gas limit
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction to be mined
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                return True, f"Successfully set address for {name} to {address}"
            else:
                return False, "Transaction failed"
                
        except Exception as e:
            return False, f"Error setting address: {str(e)}"

    def create_subdomain(self, domain: str, subdomain: str, owner_address: Optional[str] = None) -> Tuple[bool, str]:
        """Create a subdomain for an ENS name."""
        if not self.account:
            return False, "No account configured"

        try:
            # Check ownership of parent domain
            parent_owner = self.get_owner(domain)
            if not parent_owner or parent_owner.lower() != self.account.address.lower():
                return False, "You don't own the parent domain"
            
            # If no owner specified, use the current account
            if not owner_address:
                owner_address = self.account.address
            else:
                if not is_address(owner_address):
                    return False, "Invalid owner address"
                owner_address = to_checksum_address(owner_address)
            
            # Create full subdomain name
            full_name = f"{subdomain}.{domain}"
            
            # Get namehash
            node = self.w3.ens.namehash(full_name)
            
            # Build transaction
            transaction = self.registry.functions.setSubnodeOwner(
                self.w3.ens.namehash(domain),
                self.w3.keccak(text=subdomain),
                owner_address
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 100000,  # Estimated gas limit
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction to be mined
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                return True, f"Successfully created subdomain {full_name}"
            else:
                return False, "Transaction failed"
                
        except Exception as e:
            return False, f"Error creating subdomain: {str(e)}"

    def get_subdomains(self, domain: str) -> List[str]:
        """Get list of subdomains for a domain."""
        try:
            # Get all NewOwner events for the domain
            node = self.w3.ens.namehash(domain)
            
            # Get the latest block number
            latest_block = self.w3.eth.block_number
            
            # Create filter for NewOwner events
            event_filter = self.registry.events.NewOwner.create_filter(
                fromBlock=0,
                toBlock=latest_block,
                argument_filters={'node': node}
            )
            
            # Get all events
            events = event_filter.get_all_entries()
            
            # Process events to get subdomain names
            subdomains = set()
            for event in events:
                try:
                    # Try to get the label (subdomain name) from the event
                    label = self.w3.ens.name(event['args']['owner'])
                    if label:
                        subdomains.add(label)
                except:
                    continue
            
            return list(subdomains)
            
        except Exception as e:
            print(f"Error getting subdomains for {domain}: {e}")
            return []

    async def batch_check_availability(self, names: List[str]) -> Dict[str, bool]:
        """Check availability of multiple names in parallel."""
        tasks = []
        for name in names:
            name = name.lower().replace('.eth', '')
            tasks.append(self.check_name_available(name))
        results = await asyncio.gather(*tasks)
        return dict(zip(names, results))

    async def batch_get_costs(self, names: List[str], duration_years: int = 1) -> Dict[str, Optional[float]]:
        """Get registration costs for multiple names in parallel."""
        tasks = []
        for name in names:
            tasks.append(self.get_registration_cost(name, duration_years))
        results = await asyncio.gather(*tasks)
        return dict(zip(names, results))

    def bulk_create_subdomains(self, domain: str, subdomains: List[str], owner_address: Optional[str] = None) -> List[Tuple[str, bool, str]]:
        """Create multiple subdomains in bulk."""
        results = []
        for subdomain in subdomains:
            success, message = self.create_subdomain(domain, subdomain, owner_address)
            results.append((subdomain, success, message))
        return results

    def estimate_gas_costs(self, name: str) -> Dict[str, float]:
        """Estimate gas costs for various operations."""
        try:
            gas_price = self.w3.eth.gas_price
            estimates = {}
            
            # Registration gas estimate
            if self.check_name_available(name):
                reg_gas = self.controller.functions.register(
                    name,
                    self.account.address if self.account else "0x0000000000000000000000000000000000000000",
                    31536000,  # 1 year
                    os.urandom(32)
                ).estimate_gas()
                estimates['register'] = self.w3.from_wei(reg_gas * gas_price, 'ether')
            
            # Transfer gas estimate
            transfer_gas = self.registry.functions.setOwner(
                self.w3.ens.namehash(name),
                "0x0000000000000000000000000000000000000000"
            ).estimate_gas()
            estimates['transfer'] = self.w3.from_wei(transfer_gas * gas_price, 'ether')
            
            # Resolver gas estimate
            resolver = self.w3.ens.resolver(name)
            if resolver:
                resolver_gas = resolver.functions.setAddr(
                    self.w3.ens.namehash(name),
                    "0x0000000000000000000000000000000000000000"
                ).estimate_gas()
                estimates['set_address'] = self.w3.from_wei(resolver_gas * gas_price, 'ether')
            
            return estimates
        except Exception as e:
            print(f"Error estimating gas costs: {e}")
            return {}

    def get_expiry_date(self, name: str) -> Optional[datetime]:
        """Get the expiry date of an ENS name."""
        try:
            # Get the registration timestamp
            node = self.w3.ens.namehash(name)
            name_without_eth = name.lower().replace('.eth', '')
            
            # Get the latest registration event
            latest_block = self.w3.eth.block_number
            events = self.controller.events.NameRegistered.get_logs(
                fromBlock=0,
                toBlock=latest_block,
                argument_filters={'name': name_without_eth}
            )
            
            if not events:
                return None
                
            # Get the latest registration
            latest_event = max(events, key=lambda e: e['blockNumber'])
            registration_time = self.w3.eth.get_block(latest_event['blockNumber'])['timestamp']
            duration = latest_event['args']['duration']
            
            return datetime.fromtimestamp(registration_time + duration)
        except Exception as e:
            print(f"Error getting expiry date: {e}")
            return None

    def get_name_details(self, name: str) -> Dict[str, Any]:
        """Get comprehensive details about an ENS name."""
        details = {
            'name': name,
            'available': False,
            'owner': None,
            'resolver': None,
            'address': None,
            'content_hash': None,
            'text_records': {},
            'expiry_date': None,
            'subdomains': [],
            'estimated_gas_costs': {},
        }
        
        try:
            # Basic details
            details['available'] = self.check_name_available(name)
            details['owner'] = self.get_owner(name)
            details['resolver'] = self.get_resolver(name)
            details['address'] = self.resolve_name(name)
            details['content_hash'] = self.get_content_hash(name)
            
            # Text records
            text_keys = ['email', 'url', 'avatar', 'description', 'notice', 'keywords', 'com.twitter', 'com.github']
            for key in text_keys:
                value = self.get_text_record(name, key)
                if value:
                    details['text_records'][key] = value
            
            # Additional information
            details['expiry_date'] = self.get_expiry_date(name)
            details['subdomains'] = self.get_subdomains(name)
            
            if details['owner']:
                details['estimated_gas_costs'] = self.estimate_gas_costs(name)
            
            return details
        except Exception as e:
            print(f"Error getting name details: {e}")
            return details

    def watch_names(self, names: List[str], callback: callable) -> None:
        """Watch for changes in ENS names with activity tracking."""
        try:
            # Create filters for relevant events
            filters = []
            for name in names:
                node = self.w3.ens.namehash(name)
                
                # Transfer events
                transfer_filter = self.registry.events.Transfer.create_filter(
                    fromBlock='latest',
                    argument_filters={'node': node}
                )
                filters.append(('Transfer', name, transfer_filter))
                
                # NewOwner events
                new_owner_filter = self.registry.events.NewOwner.create_filter(
                    fromBlock='latest',
                    argument_filters={'node': node}
                )
                filters.append(('NewOwner', name, new_owner_filter))
                
                # Resolver events
                resolver = self.w3.ens.resolver(name)
                if resolver:
                    addr_filter = resolver.events.AddrChanged.create_filter(
                        fromBlock='latest',
                        argument_filters={'node': node}
                    )
                    filters.append(('AddrChanged', name, addr_filter))
                    
                    # Content hash events
                    content_filter = resolver.events.ContenthashChanged.create_filter(
                        fromBlock='latest',
                        argument_filters={'node': node}
                    )
                    filters.append(('ContenthashChanged', name, content_filter))
                    
                    # Text record events
                    text_filter = resolver.events.TextChanged.create_filter(
                        fromBlock='latest',
                        argument_filters={'node': node}
                    )
                    filters.append(('TextChanged', name, text_filter))
            
            # Watch for events
            while True:
                for event_type, name, event_filter in filters:
                    for event in event_filter.get_new_entries():
                        # Track activity
                        self.activity_tracker.add_activity(name, event_type, {
                            'block': event['blockNumber'],
                            'transaction': event['transactionHash'].hex(),
                            'args': {k: v.hex() if isinstance(v, bytes) else str(v) 
                                   for k, v in event['args'].items()}
                        })
                        
                        # Call the callback
                        callback(event_type, name, event)
                
                time.sleep(1)  # Poll every second
                
        except Exception as e:
            print(f"Error watching names: {e}")

    def get_name_activity(self, name: str, 
                         start_date: Optional[datetime] = None,
                         end_date: Optional[datetime] = None,
                         include_transactions: bool = True) -> Dict[str, Any]:
        """Get comprehensive activity report for a name."""
        activities = self.activity_tracker.get_activities(name, start_date, end_date)
        
        # Get on-chain transactions if requested
        transactions = []
        if include_transactions:
            transactions = asyncio.run(self.get_transaction_history(name))
        
        return {
            'name': name,
            'period': {
                'start': start_date.isoformat() if start_date else None,
                'end': end_date.isoformat() if end_date else None
            },
            'events': activities,
            'transactions': transactions
        }

    def get_reverse_records(self, addresses: List[str]) -> Dict[str, Optional[str]]:
        """Get reverse records for multiple addresses."""
        results = {}
        for address in addresses:
            name = self.reverse_resolve(address)
            results[address] = name
        return results

    def validate_and_normalize_name(self, name: str) -> Tuple[bool, str, List[str]]:
        """Validate and normalize an ENS name."""
        issues = []
        normalized = name.lower()
        
        # Basic validation
        if len(normalized) < 3:
            issues.append("Name too short (minimum 3 characters)")
        
        if not normalized.endswith('.eth'):
            normalized += '.eth'
        
        # Character validation
        allowed_chars = set('abcdefghijklmnopqrstuvwxyz0123456789-.')
        if not set(normalized).issubset(allowed_chars):
            issues.append("Contains invalid characters")
        
        if '--' in normalized:
            issues.append("Contains consecutive hyphens")
        
        if normalized.startswith('-') or normalized.endswith('-'):
            issues.append("Cannot start or end with hyphen")
        
        if '..' in normalized:
            issues.append("Contains consecutive dots")
        
        # Length validation for labels
        labels = normalized.split('.')
        for label in labels:
            if len(label) > 63:
                issues.append(f"Label '{label}' exceeds 63 characters")
        
        return (len(issues) == 0, normalized, issues)

    async def get_transaction_history(self, name: str) -> List[dict]:
        """Get transaction history for an ENS name from Etherscan."""
        if not self.etherscan_api_key:
            return []
            
        try:
            # Get the contract addresses we need to monitor
            registry_address = ENS_REGISTRY_ADDRESS.lower()
            resolver = self.w3.ens.resolver(name)
            resolver_address = resolver.address.lower() if resolver else None
            
            # Get the node (namehash) for the name
            node = self.w3.ens.namehash(name)
            
            async with aiohttp.ClientSession() as session:
                # Get transactions from Etherscan
                url = f"https://api.etherscan.io/api"
                params = {
                    "module": "account",
                    "action": "txlist",
                    "address": registry_address,
                    "apikey": self.etherscan_api_key,
                    "sort": "desc"
                }
                
                async with session.get(url, params=params) as response:
                    data = await response.json()
                    
                if data["status"] != "1":
                    return []
                    
                transactions = []
                for tx in data["result"]:
                    # Check if transaction input data contains our namehash
                    if node in tx["input"]:
                        transactions.append({
                            "hash": tx["hash"],
                            "from": tx["from"],
                            "to": tx["to"],
                            "timestamp": datetime.fromtimestamp(int(tx["timeStamp"])),
                            "method": tx["methodId"],
                            "contract": "Registry",
                            "value": self.w3.from_wei(int(tx["value"]), 'ether')
                        })
                
                # If we have a resolver, get its transactions too
                if resolver_address:
                    params["address"] = resolver_address
                    async with session.get(url, params=params) as response:
                        data = await response.json()
                        
                    if data["status"] == "1":
                        for tx in data["result"]:
                            if node in tx["input"]:
                                transactions.append({
                                    "hash": tx["hash"],
                                    "from": tx["from"],
                                    "to": tx["to"],
                                    "timestamp": datetime.fromtimestamp(int(tx["timeStamp"])),
                                    "method": tx["methodId"],
                                    "contract": "Resolver",
                                    "value": self.w3.from_wei(int(tx["value"]), 'ether')
                                })
                
                # Sort by timestamp
                transactions.sort(key=lambda x: x["timestamp"], reverse=True)
                return transactions
                
        except Exception as e:
            print(f"Error getting transaction history: {e}")
            return []

    async def resolve_globally(self, name: str) -> Dict[str, Any]:
        """Resolve ENS name globally across all networks."""
        return await self.global_resolver.resolve_globally(name)
    
    async def verify_global_resolution(self, name: str, network: Optional[str] = None) -> Dict[str, Any]:
        """Verify global resolution setup."""
        if network:
            return await self.global_resolver.verify_resolution(name, network)
        
        results = {
            'name': name,
            'networks': {}
        }
        
        for net in self.network_manager.get_available_networks():
            results['networks'][net] = await self.global_resolver.verify_resolution(name, net)
        
        return results