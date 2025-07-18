from models.db import SessionLocal
from models.user_profile import UserProfile

def analyze_behavior(data):
    """
    Takes in validated BehavioralData (from Pydantic).
    Compares to stored user profile.
    Returns a confidence score.
    """
    # ✅ 1) Calculate keystroke typing speed
    avg_typing_interval = 0.0
    if len(data.keystrokes) > 1:
        intervals = []
        for i in range(1, len(data.keystrokes)):
            prev = data.keystrokes[i - 1].up_time
            curr = data.keystrokes[i].down_time
            diff = curr - prev
            if diff >= 0:
                intervals.append(diff)
        if intervals:
            avg_typing_interval = sum(intervals) / len(intervals)

    # ✅ 2) Calculate touch behavior (average duration)
    avg_touch_duration = 0.0
    if data.touch_patterns:
        durations = [touch.duration for touch in data.touch_patterns]
        avg_touch_duration = sum(durations) / len(durations)

    # ✅ 3) Open DB session
    db = SessionLocal()
    profile = db.query(UserProfile).filter(UserProfile.user_id == data.user_id).first()

    # ✅ 4) Geo check (AFTER you get profile)
    geo_confidence = 1  # assume good
    if profile and profile.last_geo and profile.last_geo != data.geo_ip:
        geo_confidence = 0.7  # penalty for suspicious location

    # ✅ 5) If user exists: compare & update
    if profile:
        typing_diff = abs(avg_typing_interval - profile.avg_typing_speed)
        touch_diff = abs(avg_touch_duration - profile.avg_touch_duration)

        confidence_typing = max(0.5, 1 - typing_diff)
        confidence_touch = max(0.5, 1 - touch_diff) if avg_touch_duration > 0 else 1

        confidence = (confidence_typing + confidence_touch + geo_confidence) / 3

        # Rolling averages
        profile.avg_typing_speed = (profile.avg_typing_speed + avg_typing_interval) / 2
        if avg_touch_duration > 0:
            profile.avg_touch_duration = (profile.avg_touch_duration + avg_touch_duration) / 2

    else:
        # ✅ New user
        profile = UserProfile(
            user_id=data.user_id,
            avg_typing_speed=avg_typing_interval,
            avg_touch_duration=avg_touch_duration,
            last_geo=data.geo_ip
        )
        confidence = 0.8  # neutral trust for new user

    # ✅ Save & close
    profile.last_geo = data.geo_ip  # always update
    db.add(profile)
    db.commit()
    db.close()

    return confidence
