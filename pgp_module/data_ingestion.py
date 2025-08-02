import datetime
from dateutil import parser


def parse_transaction(tx_json: dict) -> dict:
    """
    Validate and normalize incoming transaction JSON.
    Expects keys: timestamp, latitude, longitude, buyer, seller
    Returns dict: {user, time, lat, lon, seller}
    """
    try:
        ts = parser.isoparse(tx_json["timestamp"])
    except Exception:
        raise ValueError("Invalid or missing 'timestamp' field")
    if not isinstance(tx_json.get("latitude"), (int, float)):
        raise ValueError("Invalid or missing 'latitude' field")
    if not isinstance(tx_json.get("longitude"), (int, float)):
        raise ValueError("Invalid or missing 'longitude' field")
    if "buyer" not in tx_json:
        raise ValueError("Missing 'buyer' field")
    # Normalize
    return {
        "user": str(tx_json["buyer"]),
        "time": ts,
        "lat": float(tx_json["latitude"]),
        "lon": float(tx_json["longitude"]),
        "seller": str(tx_json.get("seller", ""))
    }