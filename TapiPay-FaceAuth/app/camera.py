import os
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File
from deepface import DeepFace

router = APIRouter()

@router.post("/upload-face/")
async def upload_face(file: UploadFile = File(...)):
    contents = await file.read()
    npimg = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    known_dir = "known_faces"
    best_match = None
    best_score = 100

    for filename in os.listdir(known_dir):
        path = os.path.join(known_dir, filename)
        try:
            result = DeepFace.verify(frame, path, enforce_detection=False)
            if result["verified"] and result["distance"] < best_score:
                best_score = result["distance"]
                best_match = filename.split(".")[0]
        except:
            continue

    if best_match:
        confidence = round((1 - best_score) * 100, 2)
        return {"name": best_match, "confidence": confidence}
    return {"name": "Unknown", "confidence": 0.0}
