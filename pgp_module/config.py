# Configuration parameters for DTG/PGP module

# Clustering parameters
CLUSTER_EPS_KM = 0.5         # DBSCAN epsilon in kilometers
CLUSTER_MIN_SAMPLES = 3      # DBSCAN minimum samples

# Anomaly detection thresholds and weights
MAX_DISTANCE_KM = 50.0       # distance beyond which transactions are fully anomalous
W_DISTANCE = 0.6             # weight for distance component in anomaly score
W_TIME = 0.4                 # weight for time component in anomaly score
ANOMALY_THRESHOLD = 0.7      # score threshold for flagging anomaly
UPDATE_ON_ANOMALY = False    # whether to update profile with anomalous transactions

# Decay (exponential) settings for profile aging
DECAY_FACTOR = 0.99          # multiply cluster counts by this each decay step
CLUSTER_PRUNE_THRESHOLD = 0.5 # clusters with count below this are removed

# Time slot definitions (example: morning, afternoon, evening, night)
TIME_SLOTS = {
    "night": range(0, 6),
    "morning": range(6, 12),
    "afternoon": range(12, 18),
    "evening": range(18, 24),
}