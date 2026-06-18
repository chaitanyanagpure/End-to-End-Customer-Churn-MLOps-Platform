import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PredictionRecord, ModelMetadata } from '../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw,
  PieChart as PieIcon,
  Map,
  DollarSign
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [historyRes, modelsRes] = await Promise.all([
        api.get<PredictionRecord[]>('/predict/history'),
        api.get<ModelMetadata[]>('/registry/models')
      ]);
      setHistory(historyRes.data);
      setModels(modelsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActiveModel = () => models.find(m => m.status === 'Production') || models[0];

  // 1. Calculate KPIs
  const totalCustomers = history.length;
  const highRiskCount = history.filter(r => r.risk_category === 'High').length;
  const avgProbability = totalCustomers > 0 
    ? history.reduce((sum, r) => sum + r.churn_probability, 0) / totalCustomers 
    : 0.0;
  
  const activeModel = getActiveModel();
  const activeModelVersion = activeModel ? activeModel.version : 'None';
  const activeModelAccuracy = activeModel && activeModel.metrics_json 
    ? activeModel.metrics_json.f1 
    : 0.0;

  // 2. Chart: Churn Risk Distribution (Pie)
  const lowRiskCount = history.filter(r => r.risk_category === 'Low').length;
  const medRiskCount = history.filter(r => r.risk_category === 'Medium').length;
  
  const riskDistributionData = [
    { name: 'Low Risk', value: lowRiskCount || 1, color: '#10B981' },
    { name: 'Medium Risk', value: medRiskCount, color: '#F59E0B' },
    { name: 'High Churn Risk', value: highRiskCount, color: '#EF4444' }
  ].filter(item => item.value > 0 || item.name === 'Low Risk'); // keep low risk default if empty

  // 3. Chart: Location Churn Risk (Bar)
  const locations = ["New York", "Los Angeles", "Chicago", "Miami", "Houston"];
  const locationData = locations.map(loc => {
    const locRecords = history.filter(r => r.location === loc);
    const totalLoc = locRecords.length;
    const highRiskLoc = locRecords.filter(r => r.risk_category === 'High').length;
    return {
      location: loc,
      'Total Customer': totalLoc,
      'High Risk Customer': highRiskLoc
    };
  });

  // 4. Chart: Payment History Risk (Bar)
  const payments = ["On Time", "Delayed", "Missed"];
  const paymentData = payments.map(pmt => {
    const pmtRecords = history.filter(r => r.payment_history === pmt);
    const totalPmt = pmtRecords.length;
    const highRiskPmt = pmtRecords.filter(r => r.risk_category === 'High').length;
    return {
      payment: pmt,
      'Total Customer': totalPmt,
      'High Risk Customer': highRiskPmt
    };
  });

  return (
    <div className="space-y-6">
      {/* Sync Button */}
      <div className="flex justify-between items-center">
        <p className="text-text-muted text-sm font-normal">Executive intelligence dashboard displaying aggregate customer churn insights and active ML registers.</p>
        <button 
          onClick={fetchDashboardData}
          className="bg-white border border-border hover:bg-background text-text p-2 rounded-lg flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Analytics</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted text-sm font-medium">Recompiling dashboard metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Audited</span>
                <span className="text-xl font-bold text-text mt-0.5">{totalCustomers}</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">High Risk Cases</span>
                <span className="text-xl font-bold text-text mt-0.5">{highRiskCount}</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Avg Churn Prob</span>
                <span className="text-xl font-bold text-text mt-0.5">{(avgProbability * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                <Activity size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Active Version</span>
                <span className="text-xl font-bold text-text mt-0.5">{activeModelVersion}</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Model Accuracy</span>
                <span className="text-xl font-bold text-text mt-0.5">{(activeModelAccuracy * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Charts Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution (Pie) */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between h-[340px]">
              <h3 className="font-bold text-xs text-text flex items-center mb-4">
                <PieIcon size={14} className="mr-1.5 text-primary" /> Churn Risk Distribution
              </h3>
              
              <div className="h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends */}
              <div className="flex justify-center space-x-4 text-[10px] font-semibold">
                {riskDistributionData.map(item => (
                  <div key={item.name} className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: item.color }}></span>
                    <span className="text-text-muted">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Locations Risk (Bar) */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm h-[340px] flex flex-col justify-between">
              <h3 className="font-bold text-xs text-text flex items-center mb-4">
                <Map size={14} className="mr-1.5 text-primary" /> Geographic Risk Profile
              </h3>
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="location" tick={{ fontSize: 9, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} />
                    <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                    <Legend formatter={(value) => <span style={{ color: '#0f172a', fontWeight: 600 }}>{value}</span>} wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="Total Customer" fill="#E2E8F0" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="High Risk Customer" fill="#EF4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Billing Churn (Bar) */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm h-[340px] flex flex-col justify-between">
              <h3 className="font-bold text-xs text-text flex items-center mb-4">
                <DollarSign size={14} className="mr-1.5 text-primary" /> Billing Status Risk Profile
              </h3>
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="payment" tick={{ fontSize: 9, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} />
                    <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                    <Legend formatter={(value) => <span style={{ color: '#0f172a', fontWeight: 600 }}>{value}</span>} wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="Total Customer" fill="#E2E8F0" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="High Risk Customer" fill="#EF4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
