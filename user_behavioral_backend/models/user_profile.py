from sqlalchemy import Column, String, Float
from sqlalchemy.ext.declarative import declarative_base

# Defines database table
Base = declarative_base()

# Define the UserProfile table
class UserProfile(Base):
    __tablename__ = "user_profiles"  # This is the table name in the database

    user_id = Column(String, primary_key=True, index=True)  # Primary key column
    avg_typing_speed = Column(Float)  # Store the average typing interval
    avg_touch_duration = Column(Float)   # Store average touch duration
    last_geo = Column(String)         # Store last known geo cluster
