import hashlib
from app.models import VoteReceipt

def generate_receipt_hash(receipt: VoteReceipt) -> str:
    """
    Deterministically generates a SHA-256 hash using vote metadata.
    """
    # Use deterministic existing fields that won't change
    # receipt_id is UUID, convert to string
    # timestamp is datetime, convert to ISO format string
    
    receipt_str = str(receipt.receipt_id)
    vote_str = str(receipt.vote_id)
    election_str = str(receipt.election_id) if receipt.election_id else "NONE"
    time_str = receipt.timestamp.isoformat() if receipt.timestamp else "NONE"
    polling_str = str(receipt.polling_station) if receipt.polling_station else "NONE"
    district_str = str(receipt.district) if receipt.district else "NONE"
    vc_str = str(receipt.verification_code)
    
    # Combine uniquely
    payload = f"{receipt_str}|{vote_str}|{election_str}|{time_str}|{polling_str}|{district_str}|{vc_str}"
    
    # Generate SHA-256
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def verify_receipt_hash(receipt: VoteReceipt) -> str:
    """
    Verifies if the receipt's stored hash matches its deterministic hash.
    Returns 'VALID' or 'INVALID'.
    """
    if not receipt.cryptographic_hash:
        return "INVALID"
        
    expected_hash = generate_receipt_hash(receipt)
    if expected_hash == receipt.cryptographic_hash:
        return "VALID"
    return "INVALID"