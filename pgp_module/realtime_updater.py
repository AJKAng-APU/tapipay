import config as config
from geo_profile import GeoProfile
from anomaly_detector import score_transaction

# In-memory profiles store
user_profiles = {}


def process_new_transaction(tx):
    user = tx['user']
    profile = user_profiles.get(user)
    if profile is None:
        profile = GeoProfile(user)
        user_profiles[user] = profile
    anomaly, score = score_transaction(profile, tx)
    # Update profile if not anomaly or allowed
    if not anomaly or config.UPDATE_ON_ANOMALY:
        profile.update_with_transaction(tx)
    return anomaly, score


def decay_profiles():
    for profile in user_profiles.values():
        new_clusters = []
        for c in profile.clusters:
            c['count'] *= config.DECAY_FACTOR
            if c['count'] >= config.CLUSTER_PRUNE_THRESHOLD:
                new_clusters.append(c)
        profile.clusters = new_clusters
