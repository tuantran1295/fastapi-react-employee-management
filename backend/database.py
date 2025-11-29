"""
Database connection and session management.
"""
from sqlmodel import Session, SQLModel, create_engine
from config import DATABASE_URL

# Create database engine
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def get_session() -> Session:
    """
    Dependency function to get a database session.
    Used by FastAPI endpoints via Depends(get_session).
    """
    with Session(engine) as session:
        yield session


def init_db() -> None:
    """
    Initialize database by creating all tables.
    This should be called on application startup.
    """
    SQLModel.metadata.create_all(engine)

