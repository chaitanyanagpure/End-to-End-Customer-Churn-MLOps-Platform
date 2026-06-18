from sqlalchemy.orm import Session
from app.repositories.activity_log import ActivityLogRepository
from app.models.activity_log import ActivityLog
from uuid import UUID
from typing import Optional

class AuditService:
    def __init__(self, db: Session):
        self.log_repo = ActivityLogRepository(db)

    def log_action(self, user_id: Optional[UUID], action: str, details: str, ip_address: Optional[str] = None) -> ActivityLog:
        new_log = ActivityLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address
        )
        return self.log_repo.create(new_log)
