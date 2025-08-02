import hmac
import hashlib

# Secret key used for HMAC signing (in a real app, this should be secure and not hard-coded)
SECRET_KEY = b'supersecretkey'

def generate_signature(user_id: str, device_id: str, timestamp: str, location: str, amount: float) -> str:
    """
    Generate an HMAC-SHA256 signature for the given transaction fields.
    Fields: user_id, device_id, timestamp, location, amount.
    Returns the signature as a hexadecimal string.
    """
    # Concatenate fields into a message string separated by '|'
    message = f"{user_id}|{device_id}|{timestamp}|{location}|{amount}"
    # Compute HMAC-SHA256 using the secret key
    digest = hmac.new(SECRET_KEY, message.encode('utf-8'), hashlib.sha256).hexdigest()
    return digest

def generate_chain_hash(prev_hash_hex: str, current_record_str: str) -> str:
    """
    Compute the HMAC-SHA256 chain hash for the current record.
    Takes the previous record's hash (hex string, or "" if none) and the current record's string.
    Returns the new chain hash as a hex string.
    """
    # Include the previous hash in the message to chain the records
    if prev_hash_hex:
        chain_input = f"{prev_hash_hex}|{current_record_str}"
    else:
        chain_input = current_record_str
    digest = hmac.new(SECRET_KEY, chain_input.encode('utf-8'), hashlib.sha256).hexdigest()
    return digest
