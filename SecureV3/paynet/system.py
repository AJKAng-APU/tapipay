import uuid
from datetime import datetime
from paynet import security
from paynet.ledger import Ledger

class OfflinePaymentSystem:
    """
    Core offline payment system logic (simplified).
    Manages a user's balance and handles secure offline transactions.
    """
    def __init__(self, user_id: str, initial_balance: float, device_id: str = None, db_path: str = ":memory:"):
        self.user_id = user_id
        self.total_balance = initial_balance
        # Assign a device ID (provided or generate a new UUID for this device)
        self.device_id = device_id if device_id is not None else str(uuid.uuid4())
        # Initialize the ledger for transaction records
        self.ledger = Ledger(db_path)
        # Keep track of the last chain hash for linking new transactions
        self.last_chain_hash = self.ledger.get_last_chain_hash() or ""
    
    def make_transaction(self, amount: float, location: str):
        """
        Perform an offline transaction for the given amount and location.
        Returns a dictionary of transaction details if successful.
        Raises ValueError if the transaction is not allowed (e.g., insufficient balance).
        """
        # Ensure the amount is positive
        if amount <= 0:
            raise ValueError("Transaction amount must be positive.")
        # Check for sufficient balance
        if amount > self.total_balance:
            raise ValueError("Insufficient balance for this transaction.")
        # Generate a timestamp for the transaction
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # Generate HMAC signature for this transaction (user, device, timestamp, location, amount)
        signature = security.generate_signature(self.user_id, self.device_id, timestamp, location, amount)
        # Build record string including all fields (except chain_hash) for chain hashing
        record_str = f"{self.user_id}|{self.device_id}|{timestamp}|{location}|{amount}|{signature}"
        # Compute new chain hash using the previous chain hash and current record string
        chain_hash = security.generate_chain_hash(self.last_chain_hash, record_str)
        # Append the transaction to the ledger
        self.ledger.add_transaction(self.user_id, self.device_id, timestamp, location, amount, signature, chain_hash)
        # Deduct the amount from the total balance
        self.total_balance -= amount
        # Update last_chain_hash for the next transaction
        self.last_chain_hash = chain_hash
        # Return the details of the transaction
        return {
            "user_id": self.user_id,
            "device_id": self.device_id,
            "timestamp": timestamp,
            "location": location,
            "amount": amount,
            "signature": signature,
            "chain_hash": chain_hash
        }
    
    def verify_ledger_integrity(self) -> bool:
        """
        Verify all transactions in the ledger for correct signatures, hash chain continuity, and device binding.
        Returns True if the ledger is valid (untampered), False if any issue is detected.
        """
        transactions = self.ledger.get_all_transactions()
        prev_chain = ""
        for tx in transactions:
            # Recompute signature from stored fields and compare
            recalculated_sig = security.generate_signature(tx["user_id"], tx["device_id"],
                                                          tx["timestamp"], tx["location"], tx["amount"])
            if recalculated_sig != tx["signature"]:
                return False  # Signature mismatch -> data tampering
            # Recompute chain hash from previous hash and current record (including signature)
            record_str = f"{tx['user_id']}|{tx['device_id']}|{tx['timestamp']}|{tx['location']}|{tx['amount']}|{tx['signature']}"
            recalculated_chain = security.generate_chain_hash(prev_chain, record_str)
            if recalculated_chain != tx["chain_hash"]:
                return False  # Chain hash mismatch -> sequence tampering
            # Update prev_chain for next iteration
            prev_chain = tx["chain_hash"]
            # Check device binding
            if tx["device_id"] != self.device_id:
                return False  # Record not from this device (device binding violation)
        return True
