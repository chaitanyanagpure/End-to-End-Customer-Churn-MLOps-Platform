from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
from app.api.dependencies import get_db, get_current_user
from app.services.reporting import ReportingService
from app.services.audit import AuditService
from app.models.user import User
from uuid import UUID

router = APIRouter()

@router.get("/customer/{prediction_id}")
def download_customer_pdf(
    prediction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reporting_service = ReportingService(db)
    audit_service = AuditService(db)
    
    pdf_bytes = reporting_service.generate_customer_pdf_report(prediction_id)
    
    audit_service.log_action(
        current_user.id,
        "REPORT_DOWNLOAD",
        f"Downloaded customer PDF report for prediction log '{str(prediction_id)[:8]}...'"
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=predictwise_customer_report_{str(prediction_id)[:8]}.pdf"}
    )

@router.get("/business")
def download_business_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reporting_service = ReportingService(db)
    audit_service = AuditService(db)
    
    excel_bytes = reporting_service.generate_business_excel_report()
    
    audit_service.log_action(
        current_user.id,
        "REPORT_DOWNLOAD",
        "Downloaded corporate Excel business summary report."
    )
    
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=predictwise_business_report.xlsx"}
    )
