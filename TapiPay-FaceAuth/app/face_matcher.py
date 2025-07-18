from deepface import DeepFace
import os

KNOWN_DIR = "app/known_faces"

def match_face(captured_img_path):
    best_match = None
    best_score = 0

    for fname in os.listdir(KNOWN_DIR):
        if fname.endswith(".jpg"):
            known_img_path = os.path.join(KNOWN_DIR, fname)
            try:
                result = DeepFace.verify(captured_img_path, known_img_path, model_name='Facenet', enforce_detection=False)
                similarity = (1 - result['distance']) * 100
                if similarity > best_score:
                    best_score = similarity
                    best_match = fname
            except Exception as e:
                print(f"Error comparing with {fname}: {e}")
                continue

    return {
        "matched_user": best_match,
        "confidence_percent": round(best_score, 2)
    }
