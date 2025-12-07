from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import logging

from .. import models, schemas, auth
from ..database import get_db, SQLALCHEMY_DATABASE_URL

router = APIRouter(tags=["Authentication"])
logger = logging.getLogger(__name__)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info(f"Login attempt for user: '{form_data.username}'")
    # DEBUG: Print DB URL
    print(f"DEBUG: Active DB URL: {SQLALCHEMY_DATABASE_URL}")
    
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        logger.warning(f"Login failed: User '{form_data.username}' not found.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # DEBUG: Print Hash comparison
    print(f"DEBUG: User found: {user.username}")
    print(f"DEBUG: Stored Hash: {user.password_hash}")
    verification = auth.verify_password(form_data.password, user.password_hash)
    print(f"DEBUG: Verify Result for '{form_data.password}': {verification}")

    if not verification:
        logger.warning(f"Login failed: Invalid password for user '{form_data.username}'.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info(f"User '{form_data.username}' logged in successfully.")
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
