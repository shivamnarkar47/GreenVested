from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import QueuePool
from urllib.parse import urlparse, parse_qs
from typing import Generator
from app.config import settings

DATABASE_URL = settings.DATABASE_URL

if DATABASE_URL.startswith("sqlite"):
    # SQLite for local development
    sync_engine = create_engine(
        DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL for production
    parsed = urlparse(DATABASE_URL)
    sslmode = parse_qs(parsed.query).get("sslmode", ["prefer"])[0]

    sync_url = f"postgresql://{parsed.netloc}{parsed.path}"

    sync_engine = create_engine(
        sync_url,
        echo=settings.DEBUG,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={"sslmode": sslmode},
    )

SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=sync_engine)
