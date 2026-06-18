import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Layers, 
  RefreshCw, 
  Columns, 
  Info,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Sliders
} from 'lucide-react';

interface ExperimentRun {
  run_id: string;
  status: string;
  start_time: string;
  model_type: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
  };
  params: Record<string, string>;
}

export const Experiments: React.FC = () => {
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const response = await api.get<ExperimentRun[]>('/experiments');
      setRuns(response.data);
      // Auto select first two runs for comparison by default if available
      if (response.data.length >= 2) {
        setSelectedRunIds([response.data[0].run_id, response.data[1].run_id]);
      } else if (response.data.length === 1) {
        setSelectedRunIds([response.data[0].run_id]);
      }
    } catch (err) {
      console.error("Failed to load experiment runs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleSelectRun = (runId: string) => {
    setSelectedRunIds(prev => {
      if (prev.includes(runId)) {
        return prev.filter(id => id !== runId);
      } else {
        return [...prev, runId];
      }
    });
  };

  const getComparisonData = () => {
    const selectedRuns = runs.filter(r => selectedRunIds.includes(r.run_id));
    return selectedRuns.map(r => ({
      name: `${r.model_type} (${r.run_id.slice(0, 5)})`,
      F1: r.metrics.f1,
      Recall: r.metrics.recall,
      Precision: r.metrics.precision,
      AUC: r.metrics.roc_auc,
      Accuracy: r.metrics.accuracy,
    }));
  };

  const getSelectedRuns = () => {
    return runs.filter(r => selectedRunIds.includes(r.run_id));
  };

  // Get all unique parameters keys across selected runs
  const getUniqueParamKeys = () => {
    const selectedRuns = getSelectedRuns();
    const keys = new Set<string>();
    selectedRuns.forEach(r => {
      Object.keys(r.params).forEach(k => keys.add(k));
    });
    return Array.from(keys);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-text-muted text-sm">Trace parameters and metrics loaded directly from MLflow tracking. Select runs to compare performance.</p>
        <button 
          onClick={fetchRuns}
          className="bg-white border border-border hover:bg-background text-text p-2 rounded-lg flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Runs</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted text-sm font-medium">Fetching runs database...</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-text-muted">
          <Layers className="w-12 h-12 mx-auto mb-3 text-border" />
          <p className="text-sm">No experiment runs recorded yet. Retrain the model to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Interactive Runs List */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-md text-text mb-4 flex items-center">
                <Sliders size={16} className="mr-2 text-primary" />
                <span>Experiment Run History</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-xs">
                  <thead className="bg-background font-bold text-text-muted uppercase tracking-wider text-left">
                    <tr>
                      <th className="px-3 py-3 w-10">Select</th>
                      <th className="px-3 py-3">Run ID</th>
                      <th className="px-3 py-3">Model Type</th>
                      <th className="px-3 py-3">F1-Score</th>
                      <th className="px-3 py-3">Recall</th>
                      <th className="px-3 py-3">Precision</th>
                      <th className="px-3 py-3">ROC-AUC</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {runs.map((r) => {
                      const isSelected = selectedRunIds.includes(r.run_id);
                      return (
                        <tr key={r.run_id} className={`hover:bg-background/50 ${isSelected ? 'bg-primary/[0.01]' : ''}`}>
                          <td className="px-3 py-3">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRun(r.run_id)}
                              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                            />
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-text" title={r.run_id}>
                            {r.run_id.slice(0, 8)}...
                          </td>
                          <td className="px-3 py-3 font-semibold text-text">{r.model_type}</td>
                          <td className="px-3 py-3 font-mono text-text">{r.metrics.f1.toFixed(4)}</td>
                          <td className="px-3 py-3 font-mono text-text-muted">{r.metrics.recall.toFixed(4)}</td>
                          <td className="px-3 py-3 font-mono text-text-muted">{r.metrics.precision.toFixed(4)}</td>
                          <td className="px-3 py-3 font-mono text-text-muted">{r.metrics.roc_auc.toFixed(4)}</td>
                          <td className="px-3 py-3">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-semibold text-[10px]">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Run comparison chart (only visible if runs selected) */}
            {selectedRunIds.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-bold text-md text-text mb-4 flex items-center">
                  <TrendingUp size={16} className="mr-2 text-primary" />
                  <span>Validation Metrics Comparison</span>
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getComparisonData()} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <YAxis domain={[0.5, 1.0]} tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <ChartTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="F1" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Recall" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Precision" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="AUC" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right: Comparative Side-by-Side Parameter Details */}
          <div className="xl:col-span-1">
            {selectedRunIds.length > 0 ? (
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6 sticky top-24">
                <div>
                  <h3 className="font-bold text-md text-text flex items-center">
                    <Columns size={16} className="mr-2 text-primary" />
                    <span>Run Comparison Details</span>
                  </h3>
                  <p className="text-[10px] text-text-muted mt-1">Comparing {selectedRunIds.length} selected experiment runs.</p>
                </div>

                {/* Parameters Side-by-Side */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-text border-b border-border pb-1">Model Hyperparameters</div>
                  {getUniqueParamKeys().length === 0 ? (
                    <div className="text-xs text-text-muted italic">No hyperparameters logged.</div>
                  ) : (
                    getUniqueParamKeys().map(key => (
                      <div key={key} className="space-y-1">
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{key}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {getSelectedRuns().map(run => (
                            <div key={run.run_id} className="p-2 rounded bg-background border border-border/50 font-mono truncate" title={run.params[key] || 'N/A'}>
                              <div className="text-[9px] text-text-muted truncate mb-0.5">{run.model_type} ({run.run_id.slice(0, 4)})</div>
                              {run.params[key] || 'N/A'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Metrics comparison details */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="text-xs font-bold text-text border-b border-border pb-1">Validation Metrics Summary</div>
                  {["f1", "recall", "precision", "roc_auc", "accuracy"].map(metricKey => (
                    <div key={metricKey} className="space-y-1">
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{metricKey.toUpperCase()}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {getSelectedRuns().map(run => (
                          <div key={run.run_id} className="p-2 rounded bg-background border border-border/50 font-mono">
                            <div className="text-[9px] text-text-muted mb-0.5">{run.model_type} ({run.run_id.slice(0, 4)})</div>
                            {(run.metrics as any)[metricKey]?.toFixed(4) || '0.0000'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border p-12 text-center text-text-muted">
                <Info className="w-12 h-12 mx-auto mb-3 text-border" />
                <p className="text-xs">Select runs in the history log list to compare model hyperparameters and metrics side-by-side.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
