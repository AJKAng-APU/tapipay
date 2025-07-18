from fastapi import APIRouter
from models.behavioral import BehavioralData
from services.analyzer import analyze_behavior

router = APIRouter()

# Maps score to risk level
def risk_level(score: float):
    if score >= 0.85:
        return "LOW"
    elif score >= 0.7:
        return "MEDIUM"
    else:
        return "HIGH"

# POST endpoint
@router.post("/authenticate")
def authenticate(data: BehavioralData):
    # `data` is already validated by Pydantic
    score = analyze_behavior(data)
    level = risk_level(score)

    return {
        "confidence_score": score,
        "risk_level": level,
        "action": "ALLOW" if level == "LOW" else "STEP_UP"
    }
