import config as config
from geo_profile import GeoProfile, haversine, get_time_slot
import math

def score_transaction(user_profile: GeoProfile, tx: dict) -> (bool, float): # type: ignore
    """
    Score a single transaction for anomaly.
    Returns a tuple (is_anomaly: bool, score: float).
    """
    lat, lon, ts = tx['lat'], tx['lon'], tx['time']
    # 1. Geographic distance score
    if user_profile.clusters:
        distances = [haversine(cluster['center'], (lat, lon)) for cluster in user_profile.clusters]
        d_min = min(distances)
    else:
        distances = []
        d_min = float('inf')
    # Normalize distance score (0: near, 1: far beyond threshold)
    S_d = min(d_min / config.MAX_DISTANCE_KM, 1.0)

    # 2. Temporal score
    slot = get_time_slot(ts)
    # Global time frequency
    global_hist = user_profile.global_time_hist
    max_global = max(global_hist.values()) if global_hist else 0
    freq_global = global_hist.get(slot, 0)
    # If no history at all, treat as neutral (score=0); if slot unseen but have history, score high
    if not global_hist:
        S_t_global = 0.0
    else:
        S_t_global = 1.0 if freq_global == 0 else 1.0 - (freq_global / max_global)

    # Cluster-specific temporal score (if belongs to nearest cluster)
    S_t_cluster = 0.0
    if user_profile.clusters and distances:
        idx = distances.index(d_min)
        cluster = user_profile.clusters[idx]
        cluster_hist = cluster.get('time_hist', {})
        max_cluster = max(cluster_hist.values()) if cluster_hist else 0
        freq_cluster = cluster_hist.get(slot, 0)
        if max_cluster > 0:
            S_t_cluster = 1.0 if freq_cluster == 0 else 1.0 - (freq_cluster / max_cluster)
    # Combine time scores, taking the worst-case
    S_t = max(S_t_global, S_t_cluster)

    # 3. Combine scores
    score = config.W_DISTANCE * S_d + config.W_TIME * S_t
    is_anomaly = score >= config.ANOMALY_THRESHOLD
    return is_anomaly, round(score, 3)
