from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Port 5433 pour eviter le conflit avec PostgreSQL 18 local
DATABASE_URL = "postgresql+psycopg2://automl_user:automl_pass@localhost:5433/automl_db"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()