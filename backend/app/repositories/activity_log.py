from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from typing import List
from uuid import UUID

class ActivityLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: ActivityLog) -> ActivityLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list_all(self, limit: int = 100) -> List[ActivityLog]:
        return self.db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
