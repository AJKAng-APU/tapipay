# geo_profile.py
import numpy as np
from sklearn.cluster import DBSCAN
from math import radians, cos, sin, asin, sqrt
from collections import defaultdict
import config as config

def haversine(coord1, coord2):
    """
    Calculate the great circle distance between two points
    on the Earth (specified in decimal degrees) in kilometers.
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    # convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    # haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km


def get_time_slot(ts):
    """
    Map a datetime to a time slot label (e.g., 'morning', 'night').
    Also returns 'weekday' or 'weekend' prefix.
    """
    hour = ts.hour
    # Determine slot name
    slot = next((name for name, hrs in config.TIME_SLOTS.items() if hour in hrs), None)
    # Determine weekday/weekend
    day_type = 'weekend' if ts.weekday() >= 5 else 'weekday'
    return (day_type, slot or 'unknown')


def compute_time_histogram(times):
    """
    Given a list of datetime objects, count occurrences in each time slot.
    Returns a dict: {(day_type, slot): count, ...}
    """
    hist = defaultdict(int)
    for ts in times:
        key = get_time_slot(ts)
        hist[key] += 1
    return dict(hist)

class GeoProfile:
    def __init__(self, user_id):
        self.user_id = user_id
        self.clusters = []  # list of cluster dicts with center, weight, time_hist, etc.
        self.total_count = 0
    def build_from_history(self, transactions, eps=0.5, min_samples=3):
        # transactions: list of (lat, lon, timestamp) tuples
        coords = np.array([(lat, lon) for lat, lon, t in transactions])
        # Use haversine metric if lat/lon in radians and eps in km
        db = DBSCAN(eps=eps, min_samples=min_samples, metric='haversine').fit(np.radians(coords))
        labels = db.labels_
        # Process clustering results:
        for label in set(labels):
            if label == -1:  # noise
                continue
            members = coords[labels == label]
            center = members.mean(axis=0)
            count = len(members)
            # compute radius as max distance from center (optional)
            radius = max(haversine(center, point) for point in members)
            # time distribution for this cluster
            times = [t for (lat,lon,t) in transactions if ...]  # get times for members
            time_hist = compute_time_histogram(times)
            self.clusters.append({
                "center": tuple(center),
                "radius": radius,
                "count": count,
                "time_hist": time_hist
            })
            self.total_count += count
    def update_with_transaction(self, transaction):
        # Find nearest cluster within threshold
        lat, lon, ts = transaction["lat"], transaction["lon"], transaction["time"]
        # If within an existing cluster radius, update that cluster
        closest = min(self.clusters, key=lambda c: haversine(c["center"], (lat,lon)))
        if closest and haversine(closest["center"], (lat,lon)) <= closest["radius"]:
            closest["count"] += 1
            closest["time_hist"].update(ts)
        else:
            # create new cluster entry
            self.clusters.append({
                "center": (lat, lon),
                "radius": 0.1,  # start with a small radius
                "count": 1,
                "time_hist": {get_time_slot(ts): 1}
            })
        self.total_count += 1
    
