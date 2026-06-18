import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  LineChart, 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  ShieldCheck,
  Server,
  RefreshCw
} from 'lucide-react';

interface MonitorMetrics {
  system: {
    cpu_usage: number;
    memory_usage: number;
    storage_total_gb: number;
    storage_used_gb: number;
    storage_free_gb: number;
    storage_used_percent: number;
  };
  api: {
    total_requests: number;
    average_response_time_ms: number;
    error_rate_percent: number;
    active_connections: number;
  };
  model: {
    active_version: string;
    accuracy_score: number;
    total_predictions_performed: number;
    high_risk_alerts: number;
    data_drift_ratio: number;
  };
}

export const Monitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<MonitorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Simulated latency data over time
  const latencyData = [
    { time: '12:00', latency: 45, requests: 12 },
    { time: '12:05', latency: 38, requests: 18 },
    { time: '12:10', latency: 52, requests: 25 },
    { time: '12:15', latency: 40, requests: 15 },
    { time: '12:20', latency: 42, requests: 20 },
    { time: '12:25', latency: 35, requests: 32 },
    { time: '12:30', latency: 48, requests: 22 },
  ];

  const fetchMetrics = async () => {
    setRefreshing(true);
    try {
      const response = await api.get<MonitorMetrics>('/monitoring/metrics');
      setMetrics(response.data);
    } catch (err) {
      console.error("Failed to load monitoring metrics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto refresh every 10 seconds for real-time monitoring feel
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const ProgressCircle: React.FC<{ percent: number; label: string; info: string; colorClass: string }> = ({ percent, label, info, colorClass }) => (
    <div className="flex flex-col items-center p-4 rounded-xl border border-border bg-white shadow-sm">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#F1F5F9" strokeWidth="6" fill="transparent" />
          <circle 
            cx="50" cy="50" r="42" 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="transparent" 
            strokeDasharray="263.8"
            strokeDashoffset={263.8 - (263.8 * percent) / 100}
            strokeLinecap="round"
            className={`transition-all duration-500 ease-out ${colorClass}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-lg font-mono text-text">
          {percent}%
        </div>
      </div>
      <span className="font-bold text-xs text-text mt-3">{label}</span>
      <span className="text-[10px] text-text-muted mt-0.5">{info}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-text-muted text-sm font-normal">Audit real-time API response time profiles, CPU loads, storage levels, and data drift warnings.</p>
        <button 
          onClick={fetchMetrics}
          className="bg-white border border-border hover:bg-background text-text p-2 rounded-lg flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Force Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted text-sm font-medium">Scraping Prometheus gateway metrics...</p>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Top Level Health Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Resources */}
            <div className="md:col-span-1 space-y-4">
              <h3 className="font-bold text-md text-text flex items-center"><Cpu size={16} className="mr-2 text-primary" /> Hardware Resources</h3>
              <div className="grid grid-cols-2 gap-4">
                <ProgressCircle 
                  percent={metrics.system.cpu_usage} 
                  label="CPU Load" 
                  info="Docker Core Node" 
                  colorClass="text-primary" 
                />
                <ProgressCircle 
                  percent={metrics.system.memory_usage} 
                  label="Memory Usage" 
                  info="RAM Allocation" 
                  colorClass="text-secondary" 
                />
              </div>
            </div>

            {/* API Status Card */}
            <div className="md:col-span-1 bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-md text-text flex items-center mb-4"><Server size={16} className="mr-2 text-primary" /> API Telemetry</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-xs text-text-muted">Gateway Requests</span>
                    <span className="text-xs font-mono font-bold">{metrics.api.total_requests}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-xs text-text-muted">Active Node Connections</span>
                    <span className="text-xs font-mono font-bold">{metrics.api.active_connections}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-xs text-text-muted">Error Rates</span>
                    <span className="text-xs font-mono font-bold text-green-600">{metrics.api.error_rate_percent}%</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-text-muted mt-4 flex items-center">
                <CheckCircle size={12} className="mr-1 text-emerald-500" /> Prometheus Agent scrapes active.
              </div>
            </div>

            {/* Model Monitor status */}
            <div className="md:col-span-1 bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-md text-text flex items-center mb-4"><ShieldCheck size={16} className="mr-2 text-primary" /> ML Model Health</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-xs text-text-muted">Active Version</span>
                    <span className="text-xs font-bold text-primary">{metrics.model.active_version}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-xs text-text-muted">Model Accuracy (F1)</span>
                    <span className="text-xs font-mono font-bold">{(metrics.model.accuracy_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-xs text-text-muted">High Risk Warnings</span>
                    <span className={`text-xs font-bold ${metrics.model.high_risk_alerts > 0 ? 'text-red-500' : 'text-text'}`}>
                      {metrics.model.high_risk_alerts}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-text-muted mt-4 flex items-center">
                <CheckCircle size={12} className="mr-1 text-emerald-500" /> Model inputs stable.
              </div>
            </div>
          </div>

          {/* Graphs & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Latency History Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-border shadow-sm">
              <h3 className="font-bold text-md text-text mb-4 flex items-center"><LineChart size={16} className="mr-2 text-primary" /> API Response Time Profile (Latency)</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} unit="ms" />
                    <ChartTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="latency" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" name="Latency" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Storage Gauge */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-md text-text flex items-center mb-4"><HardDrive size={16} className="mr-2 text-primary" /> Disk Storage Allocation</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs">
                    <span>Used Space</span>
                    <span className="font-mono font-bold">{metrics.system.storage_used_gb.toFixed(1)} GB / {metrics.system.storage_total_gb.toFixed(1)} GB</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-background h-3.5 rounded-full overflow-hidden border border-border">
                    <div 
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${metrics.system.storage_used_percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>{metrics.system.storage_used_percent}% Used</span>
                    <span>{metrics.system.storage_free_gb.toFixed(1)} GB Free</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border mt-4 text-[10px] text-text-muted">
                MinIO local S3 storage partition: `/data` mount.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <p className="text-sm">Failed to connect to Prometheus telemetry endpoints.</p>
        </div>
      )}
    </div>
  );
};
