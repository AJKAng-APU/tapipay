from fastapi import FastAPI
from api.v1 import auth
from models.user_profile import Base
from models.db import engine

# Create the DB tables if they don't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router, prefix="/api/v1")

@app.get("/")
def read_root():
  return {"message" : "Behaviorals Analytics API is running"}