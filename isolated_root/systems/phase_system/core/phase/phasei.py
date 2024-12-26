import base64
from itertools import cycle

def decrypt_message(hex_string):
    """Decrypt hex string using multiple methods"""
    try:
        # Convert hex to bytes
        binary_data = bytes.fromhex(hex_string)
        
        # Base64 encode/decode step
        b64_data = base64.b64encode(binary_data).decode('utf-8')
        decoded = base64.b64decode(b64_data)
        
        # XOR operation with key
        key = b'PATTERN_KEY'  # Replace with your actual key
        xored = bytes(a ^ b for a, b in zip(decoded, cycle(key)))
        
        return xored.decode('utf-8', errors='replace')
    except Exception as e:
        return f"Decryption failed: {str(e)}"