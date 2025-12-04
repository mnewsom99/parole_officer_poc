from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, database
from .database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Parole Officer Dashboard API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Parole Officer Dashboard API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
