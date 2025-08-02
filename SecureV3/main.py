from paynet.system import OfflinePaymentSystem

# Initialize a user with an initial balance (no CTOS score or deposit concept in this simplified version)
user_id = "user123"
initial_balance = 10000.0
system = OfflinePaymentSystem(user_id=user_id, initial_balance=initial_balance)

print(f"User: {user_id}, Initial Balance: {initial_balance:.2f}")

# Offline Transaction 1
amount1 = 100.0
location1 = "Store A"
tx1 = system.make_transaction(amount1, location1)
print(f"\nTransaction 1: Spent {amount1:.2f} at {location1}")
print(f"New Balance: {system.total_balance:.2f}")
print(f"Signature: {tx1['signature']}")
print(f"Chain Hash: {tx1['chain_hash']}")

# Offline Transaction 2
amount2 = 50.0
location2 = "Store B"
tx2 = system.make_transaction(amount2, location2)
print(f"\nTransaction 2: Spent {amount2:.2f} at {location2}")
print(f"New Balance: {system.total_balance:.2f}")
print(f"Signature: {tx2['signature']}")
print(f"Chain Hash: {tx2['chain_hash']}")

# Attempt an overspend (should be blocked due to insufficient balance)
try:
    system.make_transaction(system.total_balance + 10, "Store C")
except ValueError as e:
    print(f"\nOverspend attempt blocked: {e}")

# Verify ledger integrity
if system.verify_ledger_integrity():
    print("\nLedger integrity check PASSED (all signatures and hashes valid, device ID matches).")
else:
    print("\nLedger integrity check FAILED (data tampering detected).")
