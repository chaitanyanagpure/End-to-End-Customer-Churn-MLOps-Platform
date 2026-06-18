import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PredictionRecord } from '../types';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  HelpCircle, 
  Calendar,
  History,
  ExternalLink
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const response = await api.get<PredictionRecord[]>('/predict/history');
      setRecords(response.data);
    } catch (err) {
      console.error("Failed to load records history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDownloadExcel = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await api.get('/reports/business', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'PredictWise_Corporate_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download Excel report", err);
    }
  };

  const handleDownloadPDF = async (e: React.MouseEvent, recordId: string, customerId: string) => {
    e.preventDefault();
    try {
      const response = await api.get(`/reports/customer/${recordId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PredictWise_Audit_${customerId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download PDF report", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Business Dashboard Excel Download */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="font-bold text-lg text-text">Corporate Analytics Report</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Export an aggregated business workbook containing key summary dashboards, model stability logs, and a complete scored customer database.
            </p>
          </div>
          <div className="pt-6 border-t border-border/50 mt-6 flex justify-end">
            <button
              onClick={handleDownloadExcel}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Download Excel Report</span>
            </button>
          </div>
        </div>

        {/* Card 2: Help details */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-amber-50/50 text-amber-600 p-3 rounded-lg w-fit border border-amber-100">
              <HelpCircle size={24} />
            </div>
            <h3 className="font-bold text-lg text-text">Report Specifications</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Customer risk audits (PDF format) offer single-client logs detailing raw input fields, local feature importances (SHAP), and tailormade retention recommendations. Business reports (Excel) offer aggregate insights for analyst operations.
            </p>
          </div>
          <div className="pt-6 border-t border-border/50 mt-6 text-[10px] text-text-muted">
            Reports generated dynamically based on active production model metrics.
          </div>
        </div>
      </div>

      {/* Individual Customer Audits List */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-white flex justify-between items-center">
          <h3 className="font-bold text-md text-text flex items-center">
            <History size={16} className="mr-2 text-primary" />
            <span>Generate Customer Audits</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-text-muted">Loading logs history...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <p className="text-xs">No customer predictions history available. Score a profile first.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border text-xs text-left">
            <thead className="bg-background font-bold text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Score Timestamp</th>
                <th className="px-6 py-3">Customer ID</th>
                <th className="px-6 py-3">Subscription</th>
                <th className="px-6 py-3">Monthly Charges</th>
                <th className="px-6 py-3">Churn Probability</th>
                <th className="px-6 py-3">Risk Level</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-background/25">
                  <td className="px-6 py-4 text-text-muted flex items-center"><Calendar size={12} className="mr-1.5" /> {new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono font-semibold text-text">{r.customer_id}</td>
                  <td className="px-6 py-4 text-text-muted">{r.subscription_type}</td>
                  <td className="px-6 py-4 text-text-muted">${r.monthly_charges.toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono font-semibold text-text">{(r.churn_probability * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.risk_category === "High" 
                        ? 'bg-red-50 text-red-600' 
                        : r.risk_category === "Medium" 
                          ? 'bg-amber-50 text-amber-600' 
                          : 'bg-green-50 text-green-600'
                    }`}>
                      {r.risk_category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => handleDownloadPDF(e, r.id, r.customer_id)}
                      className="text-primary hover:text-primary-hover font-semibold flex items-center space-x-1 cursor-pointer bg-transparent border-0 p-0"
                    >
                      <FileText size={12} />
                      <span>Download PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
