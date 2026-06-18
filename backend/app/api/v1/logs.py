from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user, check_admin
from app.repositories.activity_log import ActivityLogRepository
from app.models.activity_log import ActivityLog
from app.models.user import User
from typing import List, Dict, Any

router = APIRouter()

@router.get("")
def get_activity_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(check_admin)
) -> List[Dict[str, Any]]:
    log_repo = ActivityLogRepository(db)
    logs = log_repo.list_all(limit=limit)
    
    # Format for JSON Output
    results = []
    for log in logs:
        # Resolve email if user still exists
        user_email = "system"
        if log.user_id:
            from app.repositories.user import UserRepository
            user_repo = UserRepository(db)
            user = user_repo.get_by_id(log.user_id)
            if user:
                user_email = user.email
                
        results.append({
            "id": str(log.id),
            "timestamp": log.timestamp.isoformat(),
            "user": user_email,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address or "N/A"
        })
        
    return results
