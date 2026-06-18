from app.core.database import Base, engine, SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.dataset import Dataset
from app.models.prediction import Prediction
from app.models.model import ModelMetadata
from app.models.retraining_job import RetrainingJob
from app.models.activity_log import ActivityLog
from app.core.logging import logger

def init_db():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized successfully.")

    # Seed initial Admin user
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == settings.INITIAL_ADMIN_EMAIL).first()
        if not admin_user:
            logger.info(f"Seeding initial Admin user: {settings.INITIAL_ADMIN_EMAIL}")
            hashed_pwd = get_password_hash(settings.INITIAL_ADMIN_PASSWORD)
            new_admin = User(
                email=settings.INITIAL_ADMIN_EMAIL,
                password_hash=hashed_pwd,
                full_name="PredictWise Admin",
                role="Admin"
            )
            db.add(new_admin)
            db.commit()
            logger.info("Initial Admin user successfully seeded.")
        else:
            logger.info("Admin user already exists. Skipping seed.")
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
