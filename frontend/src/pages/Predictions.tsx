import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PredictionRecord, BatchPredictionResponse } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ReferenceLine,
  ResponsiveContainer 
} from 'recharts';
import { 
  Zap, 
  Upload, 
  UserPlus, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  History,
  TrendingDown
} from 'lucide-react';

export const Predictions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'history'>('single');
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  
  // Single prediction form state
  const [customerId, setCustomerId] = useState('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [location, setLocation] = useState('New York');
  const [subscriptionType, setSubscriptionType] = useState<'Basic' | 'Standard' | 'Premium'>('Standard');
  const [monthlyCharges, setMonthlyCharges] = useState<number>(79.99);
  const [totalCharges, setTotalCharges] = useState<number>(450.00);
  const [contractDuration, setContractDuration] = useState<number>(12);
  const [customerEngagement, setCustomerEngagement] = useState<number>(3);
  const [supportTickets, setSupportTickets] = useState<number>(1);
  const [paymentHistory, setPaymentHistory] = useState<'On Time' | 'Delayed' | 'Missed'>('On Time');
  
  const [singleResult, setSingleResult] = useState<PredictionRecord | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Batch prediction state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchPredictionResponse | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await api.get<PredictionRecord[]>('/predict/history');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch prediction history", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleLoading(true);
    setSingleError(null);
    setSingleResult(null);

    const payload = {
      customer_id: customerId || `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
      age: Number(age),
      gender,
      location,
      subscription_type: subscriptionType,
      monthly_charges: Number(monthlyCharges),
      total_charges: Number(totalCharges),
      contract_duration: Number(contractDuration),
      customer_engagement: Number(customerEngagement),
      support_tickets: Number(supportTickets),
      payment_history: paymentHistory
    };

    try {
      const response = await api.post<PredictionRecord>('/predict/single', payload);
      setSingleResult(response.data);
    } catch (err: any) {
      setSingleError(err.response?.data?.detail || 'Failed to generate prediction.');
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBatchFile(e.target.files[0]);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFile) return;

    setBatchLoading(true);
    setBatchError(null);
    setBatchResult(null);

    const formData = new FormData();
    formData.append('file', batchFile);

    try {
      const response = await api.post<BatchPredictionResponse>('/predict/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setBatchResult(response.data);
      setBatchFile(null);
    } catch (err: any) {
      setBatchError(err.response?.data?.detail || 'Failed to process batch predictions.');
    } finally {
      setBatchLoading(false);
    }
  };

  // Prepares SHAP data for chart
  const getShapChartData = (explanation: any) => {
    if (!explanation) return [];
    // Slice top 8 features for readability
    return explanation.slice(0, 8).map((item: any) => ({
      feature: item.feature.replace(/_/g, ' '),
      impact: item.impact,
      // Color bar red if positive impact (increases churn), green if negative (decreases churn)
      fill: item.impact > 0 ? '#EF4444' : '#10B981'
    })).reverse(); // Reverse for horizontal display bottom-to-top
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('single')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all duration-150 ${
            activeTab === 'single' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Single Customer Scoring
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all duration-150 ${
            activeTab === 'batch' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Batch Prediction (CSV)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all duration-150 ${
            activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Prediction History Log
        </button>
      </div>

      {/* Single Prediction Tab */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Input Form */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-bold text-md text-text mb-4 flex items-center">
              <UserPlus size={16} className="mr-2 text-primary" />
              <span>Customer Information Form</span>
            </h3>

            <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {singleError && (
                <div className="col-span-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start space-x-2 text-xs">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{singleError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Customer ID (Optional)</label>
                <input 
                  type="text" 
                  value={customerId} 
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="e.g. CUST-9872"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Age</label>
                <input 
                  type="number" 
                  value={age} 
                  onChange={(e) => setAge(Number(e.target.value))}
                  min={18} max={100}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Gender</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Location</label>
                <select 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="New York">New York</option>
                  <option value="Los Angeles">Los Angeles</option>
                  <option value="Chicago">Chicago</option>
                  <option value="Miami">Miami</option>
                  <option value="Houston">Houston</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Subscription Type</label>
                <select 
                  value={subscriptionType} 
                  onChange={(e) => setSubscriptionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Contract Duration (Months)</label>
                <select 
                  value={contractDuration} 
                  onChange={(e) => setContractDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={1}>1 Month (Month-to-month)</option>
                  <option value={12}>12 Months (Annual)</option>
                  <option value={24}>24 Months (Biennial)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Monthly Charges ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={monthlyCharges} 
                  onChange={(e) => setMonthlyCharges(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Total Charges ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={totalCharges} 
                  onChange={(e) => setTotalCharges(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Customer Engagement (1-5)</label>
                <select 
                  value={customerEngagement} 
                  onChange={(e) => setCustomerEngagement(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={1}>1 - Very Low</option>
                  <option value={2}>2 - Low</option>
                  <option value={3}>3 - Medium</option>
                  <option value={4}>4 - High</option>
                  <option value={5}>5 - Very High</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Support Tickets Opened</label>
                <input 
                  type="number" 
                  value={supportTickets} 
                  onChange={(e) => setSupportTickets(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Payment History Status</label>
                <select 
                  value={paymentHistory} 
                  onChange={(e) => setPaymentHistory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="On Time">On Time</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>

              <div className="col-span-2 pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={singleLoading}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  {singleLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Predict Churn Risk</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Circular Gauge & SHAP explanations */}
          <div className="lg:col-span-2 space-y-6">
            {singleResult ? (
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
                {/* Gauge Section */}
                <div className="text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">Inference Risk Score</span>
                  
                  {/* Circle SVG Gauge */}
                  <div className="relative w-36 h-36 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke={singleResult.risk_category === "High" ? "#EF4444" : singleResult.risk_category === "Medium" ? "#F59E0B" : "#10B981"} 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * singleResult.churn_probability)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold font-mono text-text">{(singleResult.churn_probability * 100).toFixed(0)}%</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${
                        singleResult.risk_category === "High" 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : singleResult.risk_category === "Medium" 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {singleResult.risk_category} Risk
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-text mt-4">Customer ID: {singleResult.customer_id}</h4>
                </div>

                {/* SHAP Chart */}
                {singleResult.explanation_json && (
                  <div>
                    <h4 className="font-bold text-xs text-text mb-3 flex items-center">
                      <TrendingDown size={14} className="mr-1.5 text-primary" />
                      <span>SHAP Prediction Drivers</span>
                    </h4>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={getShapChartData(singleResult.explanation_json)} 
                          layout="vertical"
                          margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                          <XAxis type="number" tick={{ fontSize: 9 }} />
                          <YAxis dataKey="feature" type="category" tick={{ fontSize: 9, width: 90 }} />
                          <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                          <ReferenceLine x={0} stroke="#E5E7EB" />
                          <Bar dataKey="impact" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Suggestions List */}
                {singleResult.retention_suggestions && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <h4 className="font-bold text-xs text-text flex items-center">
                      <Lightbulb size={14} className="mr-1.5 text-amber-500" />
                      <span>AI Retention Actions</span>
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {singleResult.retention_suggestions.map((s, idx) => (
                        <li key={idx} className="flex items-start space-x-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-amber-900 leading-normal">
                          <ArrowRight size={12} className="text-amber-600 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border p-12 text-center text-text-muted h-full flex flex-col justify-center items-center">
                <HelpCircle className="w-12 h-12 mb-3 text-border" />
                <p className="text-xs">Complete the customer form details on the left and trigger prediction to see risk scores, local SHAP explanation features, and retention playbooks.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Prediction Tab */}
      {activeTab === 'batch' && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="font-bold text-md text-text">Batch Inference Hub</h3>
            <p className="text-xs text-text-muted mt-1">Upload files containing thousands of customer profiles and get predictions.</p>
          </div>

          <form onSubmit={handleBatchSubmit} className="max-w-xl space-y-4">
            {batchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start space-x-2 text-xs">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{batchError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Drag & Drop Batch File</label>
              <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-8 text-center cursor-pointer transition-all duration-150 relative">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleBatchFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <Upload size={28} className="mx-auto mb-3 text-text-muted" />
                <span className="text-sm font-semibold text-text truncate block">
                  {batchFile ? batchFile.name : "Select a batch CSV file"}
                </span>
                <span className="text-[10px] text-text-muted block mt-1">File must include standard customer attributes</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!batchFile || batchLoading}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-1.5 shadow-sm"
              >
                {batchLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    <span>Scoring Batch...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={16} />
                    <span>Run Batch Process</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Batch Result Summary */}
          {batchResult && (
            <div className="pt-6 border-t border-border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/20">
                <div>
                  <h4 className="text-emerald-900 font-bold text-sm flex items-center"><CheckCircle size={16} className="mr-1.5 text-emerald-600" /> Batch Scoring Complete</h4>
                  <p className="text-xs text-emerald-800 mt-1">Successfully analyzed {batchResult.total_records} rows. Average Churn risk calculated at {(batchResult.average_churn_probability * 100).toFixed(1)}%.</p>
                </div>
                {batchResult.download_url && (
                  <a
                    href={batchResult.download_url}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <Download size={14} />
                    <span>Export Scored CSV</span>
                  </a>
                )}
              </div>

              {/* Scored Results Preview */}
              <div>
                <h4 className="font-bold text-xs text-text mb-3">Scored Records Preview (Top 5)</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-border text-xs text-left">
                    <thead className="bg-background font-bold text-text-muted uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2">Customer ID</th>
                        <th className="px-4 py-2">Monthly Charges</th>
                        <th className="px-4 py-2">Contract Duration</th>
                        <th className="px-4 py-2">Engagement</th>
                        <th className="px-4 py-2">Churn Probability</th>
                        <th className="px-4 py-2">Risk Category</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                      {batchResult.predictions.slice(0, 5).map((pred) => (
                        <tr key={pred.id}>
                          <td className="px-4 py-2 font-mono font-semibold text-text">{pred.customer_id}</td>
                          <td className="px-4 py-2 text-text-muted">${pred.monthly_charges.toFixed(2)}</td>
                          <td className="px-4 py-2 text-text-muted">{pred.contract_duration} mos</td>
                          <td className="px-4 py-2 text-text-muted">{pred.customer_engagement}/5</td>
                          <td className="px-4 py-2 font-semibold font-mono text-text">{(pred.churn_probability * 100).toFixed(1)}%</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pred.risk_category === "High" 
                                ? 'bg-red-50 text-red-600' 
                                : pred.risk_category === "Medium" 
                                  ? 'bg-amber-50 text-amber-600' 
                                  : 'bg-green-50 text-green-600'
                            }`}>
                              {pred.risk_category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Log Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-bold text-md text-text mb-4 flex items-center">
            <History size={16} className="mr-2 text-primary" />
            <span>Audit Prediction Log</span>
          </h3>

          {history.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              <p className="text-sm">No prediction records log history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-xs text-left">
                <thead className="bg-background font-bold text-text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Monthly Charges</th>
                    <th className="px-4 py-3">Tickets</th>
                    <th className="px-4 py-3">Engagement</th>
                    <th className="px-4 py-3">Churn Probability</th>
                    <th className="px-4 py-3">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-background/30 cursor-pointer" onClick={() => {
                      setSingleResult(record);
                      setActiveTab('single');
                    }}>
                      <td className="px-4 py-3 text-text-muted">{new Date(record.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-text">{record.customer_id}</td>
                      <td className="px-4 py-3 text-text-muted">${record.monthly_charges.toFixed(2)}</td>
                      <td className="px-4 py-3 text-text-muted">{record.support_tickets}</td>
                      <td className="px-4 py-3 text-text-muted">{record.customer_engagement}/5</td>
                      <td className="px-4 py-3 font-semibold font-mono text-text">{(record.churn_probability * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.risk_category === "High" 
                            ? 'bg-red-50 text-red-600' 
                            : record.risk_category === "Medium" 
                              ? 'bg-amber-50 text-amber-600' 
                              : 'bg-green-50 text-green-600'
                        }`}>
                          {record.risk_category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
