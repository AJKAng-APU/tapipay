# app.py
from flask import Flask, request, jsonify
import data_ingestion, realtime_updater

app = Flask(__name__)

@app.route('/detect_transaction', methods=['POST'])
def detect_transaction():
    tx_json = request.get_json()
    if not tx_json:
        return jsonify({"error": "Invalid JSON"}), 400
    # Step 1: Ingest & preprocess
    try:
        tx = data_ingestion.parse_transaction(tx_json)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    # Step 2: Process through updater (which includes anomaly detection)
    anomaly_flag, score = realtime_updater.process_new_transaction(tx)
    result = {
        "user": tx["user"],
        "anomaly": anomaly_flag,
        "score": score
    }
    return jsonify(result), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
