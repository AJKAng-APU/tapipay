from pydantic import BaseModel  # for JSON validation
from typing import List

# One keystroke event
class Keystroke(BaseModel):
    key: str
    down_time: float
    up_time: float

# One touch pattern event
class TouchPattern(BaseModel):
    x: float
    y: float
    pressure: float
    duration: float

# The full request body your frontend will send
class BehavioralData(BaseModel):
    user_id: str
    session_id: str
    keystrokes: List[Keystroke]
    touch_patterns: List[TouchPattern]
    geo_ip: str
