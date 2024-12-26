import sys
sys.path.append('../..')

from core.phase.phaseii import process_pattern
from core.key.key import generate_key_pairs
import requests
from bitcoin.wallet import CBitcoinSecret, P2PKHBitcoinAddress

def validate_addresses(addresses):
    """Validate Bitcoin addresses and check balances"""
    results = []
    
    for addr in addresses:
        try:
            # Validate address format
            P2PKHBitcoinAddress(addr)
            
            # Check balance using blockchain.info API
            url = f"https://blockchain.info/balance?active={addr}"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                balance = data[addr]['final_balance'] / 100000000
                
                results.append({
                    'address': addr,
                    'valid': True,
                    'balance': balance
                })
            else:
                results.append({
                    'address': addr,
                    'valid': True,
                    'balance': 'API Error'
                })
                
        except Exception as e:
            results.append({
                'address': addr,
                'valid': False,
                'error': str(e)
            })
            
    return results
    
    
    
    