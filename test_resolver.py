#!/usr/bin/env python3
"""Test script to debug resolver issues."""

from web3 import Web3
import sys

# Connect to Ethereum mainnet
w3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'))

# Test ENS name
name = "validator.eth"

print(f"Testing ENS name: {name}")

try:
    # Get resolver
    resolver = w3.ens.resolver(name)
    print(f"Resolver type: {type(resolver)}")
    print(f"Resolver: {resolver}")
    
    if hasattr(resolver, 'address'):
        print(f"Resolver address: {resolver.address}")
    else:
        print("No address attribute")
        
    # Try to get the address directly
    if resolver:
        print(f"Resolver as string: {str(resolver)}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc() 