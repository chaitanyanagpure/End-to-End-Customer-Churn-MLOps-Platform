import pandas as pd
import numpy as np
from scipy.stats import ks_2samp, chi2_contingency
from typing import Dict, Any, Tuple
from app.core.logging import logger
from app.core.s3 import s3_client

# Try importing Evidently AI, fallback to custom reports if it fails
try:
    from evidently.report import Report
    from evidently.metric_preset import DataDriftPreset
    EVIDENTLY_AVAILABLE = True
except ImportError:
    EVIDENTLY_AVAILABLE = False
    logger.warning("Evidently AI package not fully loaded. Falling back to statistical drift checks.")

class DriftDetector:
    def __init__(self, significance_level: float = 0.05, drift_ratio_threshold: float = 0.30):
        self.significance_level = significance_level
        self.drift_ratio_threshold = drift_ratio_threshold
        self.numerical_cols = [
            "age", 
            "monthly_charges", 
            "total_charges", 
            "contract_duration", 
            "customer_engagement", 
            "support_tickets"
        ]
        self.categorical_cols = ["gender", "location", "subscription_type", "payment_history"]

    def calculate_drift(self, reference_df: pd.DataFrame, current_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs statistical tests to detect feature drift between baseline and current data.
        """
        drifted_features = []
        feature_metrics = {}
        
        # 1. Evaluate numerical columns (Kolmogorov-Smirnov Test)
        for col in self.numerical_cols:
            if col in reference_df.columns and col in current_df.columns:
                stat, p_val = ks_2samp(reference_df[col].dropna(), current_df[col].dropna())
                is_drifted = bool(p_val < self.significance_level)
                if is_drifted:
                    drifted_features.append(col)
                feature_metrics[col] = {
                    "method": "Kolmogorov-Smirnov",
                    "p_value": float(p_val),
                    "statistic": float(stat),
                    "drift_detected": is_drifted
                }

        # 2. Evaluate categorical columns (Chi-Square Contingency Test)
        for col in self.categorical_cols:
            if col in reference_df.columns and col in current_df.columns:
                try:
                    # Construct contingency table
                    ref_counts = reference_df[col].value_counts()
                    cur_counts = current_df[col].value_counts()
                    
                    # Align indices
                    combined = pd.concat([ref_counts, cur_counts], axis=1, keys=['ref', 'cur']).fillna(0) + 1 # Add 1 smoothing
                    stat, p_val, _, _ = chi2_contingency(combined)
                    is_drifted = bool(p_val < self.significance_level)
                    if is_drifted:
                        drifted_features.append(col)
                    feature_metrics[col] = {
                        "method": "Chi-Square",
                        "p_value": float(p_val),
                        "statistic": float(stat),
                        "drift_detected": is_drifted
                    }
                except Exception as e:
                    logger.warning(f"Could not calculate Chi-Square drift for {col}: {str(e)}")

        # 3. Calculate summary metrics
        total_features = len(feature_metrics)
        drift_ratio = len(drifted_features) / total_features if total_features > 0 else 0.0
        drift_detected = bool(drift_ratio >= self.drift_ratio_threshold)

        return {
            "drift_detected": drift_detected,
            "drift_ratio": drift_ratio,
            "drifted_features": drifted_features,
            "features": feature_metrics
        }

    def generate_html_report(self, reference_df: pd.DataFrame, current_df: pd.DataFrame, s3_key: str) -> str:
        """
        Creates Evidently AI HTML report and saves it to S3. 
        Falls back to generating a beautiful custom HTML table if Evidently is offline.
        """
        # Exclude metadata columns
        cols_to_compare = self.numerical_cols + self.categorical_cols
        ref_subset = reference_df[cols_to_compare]
        cur_subset = current_df[cols_to_compare]

        if EVIDENTLY_AVAILABLE:
            try:
                drift_report = Report(metrics=[DataDriftPreset()])
                drift_report.run(reference_data=ref_subset, current_data=cur_subset)
                html_content = drift_report.get_html()
                s3_client.upload_file(html_content.encode("utf-8"), s3_key, content_type="text/html")
                logger.info(f"Evidently AI HTML drift report generated and uploaded to {s3_key}")
                return s3_key
            except Exception as e:
                logger.error(f"Failed to generate Evidently report: {str(e)}. Generating fallback HTML.")

        # Fallback HTML Generation
        stats = self.calculate_drift(reference_df, current_df)
        html_content = self._build_fallback_html(stats)
        s3_client.upload_file(html_content.encode("utf-8"), s3_key, content_type="text/html")
        logger.info(f"Fallback HTML drift report generated and uploaded to {s3_key}")
        return s3_key

    def _build_fallback_html(self, stats: Dict[str, Any]) -> str:
        rows = ""
        for feature, data in stats["features"].items():
            badge_class = "bg-red-100 text-red-800" if data["drift_detected"] else "bg-green-100 text-green-800"
            badge_text = "Drifted" if data["drift_detected"] else "Stable"
            rows += f"""
            <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 12px; font-weight: 600;">{feature}</td>
                <td style="padding: 12px;">{data["method"]}</td>
                <td style="padding: 12px;">{data["statistic"]:.4f}</td>
                <td style="padding: 12px;">{data["p_value"]:.4e}</td>
                <td style="padding: 12px;"><span style="padding: 4px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;" class="{badge_class}">{badge_text}</span></td>
            </tr>
            """
        
        status_alert = """
        <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; color: #991B1B; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <h3 style="margin: 0; font-weight: 700;">Data Drift Alert!</h3>
            <p style="margin: 4px 0 0 0;">Dataset drift ratio is above the limit. Retraining is recommended.</p>
        </div>
        """ if stats["drift_detected"] else """
        <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; color: #065F46; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <h3 style="margin: 0; font-weight: 700;">Dataset Stable</h3>
            <p style="margin: 4px 0 0 0;">Features remain statistically aligned with training distribution.</p>
        </div>
        """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Data Drift Audit Report</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body {{ font-family: 'Inter', sans-serif; background-color: #F8FAFC; color: #1F2937; padding: 40px; }}
                .container {{ max-width: 900px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; border: 1px solid #E5E7EB; }}
                .bg-green-100 {{ background-color: #D1FAE5; color: #065F46; }}
                .bg-red-100 {{ background-color: #FEE2E2; color: #991B1B; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 style="margin-top: 0;">PredictWise AI - Data Drift Report</h1>
                <p style="color: #6B7280; margin-bottom: 24px;">Calculates dataset divergence metrics compared to baseline training parameters.</p>
                
                {status_alert}

                <div style="margin-bottom: 24px;">
                    <strong>Drifted Feature Ratio:</strong> {stats["drift_ratio"]:.2%} ({len(stats["drifted_features"])} / {len(stats["features"])})
                </div>

                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid #E5E7EB; color: #374151;">
                            <th style="padding: 12px;">Feature</th>
                            <th style="padding: 12px;">Statistical Test</th>
                            <th style="padding: 12px;">Test Statistic</th>
                            <th style="padding: 12px;">p-value</th>
                            <th style="padding: 12px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """
        return html

drift_detector = DriftDetector()
