import sqlite3

class Ledger:
    """
    Append-only ledger for offline transactions.
    Uses an SQLite database table to store transaction records.
    """
    def __init__(self, db_path=":memory:"):
        # Connect to SQLite (in-memory by default; can specify a file path for persistence)
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._create_table()
    
    def _create_table(self):
        # Create the transactions table if it doesn't exist
        cur = self.conn.cursor()
        cur.execute(
            "CREATE TABLE IF NOT EXISTS transactions ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "user_id TEXT, "
            "device_id TEXT, "
            "timestamp TEXT, "
            "location TEXT, "
            "amount REAL, "
            "signature TEXT, "
            "chain_hash TEXT)"
        )
        self.conn.commit()
    
    def add_transaction(self, user_id: str, device_id: str, timestamp: str, location: str,
                        amount: float, signature: str, chain_hash: str):
        """
        Append a new transaction record to the ledger.
        """
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO transactions (user_id, device_id, timestamp, location, amount, signature, chain_hash) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, device_id, timestamp, location, amount, signature, chain_hash)
        )
        self.conn.commit()
    
    def get_last_chain_hash(self) -> str:
        """
        Get the chain_hash of the last transaction in the ledger, or "" if none.
        """
        cur = self.conn.cursor()
        cur.execute("SELECT chain_hash FROM transactions ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        return row["chain_hash"] if row else ""
    
    def get_all_transactions(self):
        """
        Retrieve all transactions as a list of dictionaries.
        """
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM transactions ORDER BY id ASC")
        rows = cur.fetchall()
        return [dict(row) for row in rows]
