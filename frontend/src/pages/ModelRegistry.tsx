import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ModelMetadata } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  BookmarkCheck, 
  RefreshCw, 
  AlertCircle, 
  Play, 
  Archive, 
  Settings, 
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Info
} from 'lucide-react';

export const ModelRegistry: React.FC = () => {
  const { isAdmin } = useAuth();
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ModelMetadata[]>('/registry/models');
      setModels(response.data);
    } catch (err) {
      console.error("Failed to load model registry", err);
      setError("Failed to load models. Check backend server connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handlePromote = async (version: string, newStage: 'Production' | 'Staging' | 'Archived') => {
    try {
      await api.put(`/registry/models/${version}/stage?stage=${newStage}`);
      fetchModels();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update model stage.");
    }
  };

  const getProductionModel = () => models.find(m => m.status === 'Production');
  const getStagingModels = () => models.filter(m => m.status === 'Staging');

  const MetricProgress: React.FC<{ label: string; val: number; color: string }> = ({ label, val, color }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-text-muted">{label}</span>
        <span className="font-mono font-bold text-text">{(val * 100).toFixed(2)}%</span>
      </div>
      <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border/30">
        <div className={`h-full ${color}`} style={{ width: `${val * 100}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-text-muted text-sm">Review active models, promote versions to Production, and rollback staging candidates.</p>
        <button 
          onClick={fetchModels}
          className="bg-white border border-border hover:bg-background text-text p-2 rounded-lg flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Registry</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted text-sm font-medium">Querying registry metadata...</p>
        </div>
      ) : models.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-text-muted">
          <BookmarkCheck className="w-12 h-12 mx-auto mb-3 text-border" />
          <p className="text-sm">No models registered in the registry. Trigger retraining on the pipeline page first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Comparative Panel: Production vs Best Staging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Production Card */}
            <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg tracking-wider">
                Production Active
              </div>
              
              {getProductionModel() ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Deployed Classifier</span>
                    <h3 className="font-extrabold text-xl text-text mt-1">{getProductionModel()?.version}</h3>
                    <p className="text-xs text-text-muted mt-1">Run ID: {getProductionModel()?.run_id.slice(0, 16)}...</p>
                  </div>

                  {getProductionModel()?.metrics_json && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
                      <MetricProgress label="F1-Score" val={getProductionModel()!.metrics_json.f1} color="bg-primary" />
                      <MetricProgress label="ROC-AUC" val={getProductionModel()!.metrics_json.roc_auc} color="bg-primary" />
                      <MetricProgress label="Recall" val={getProductionModel()!.metrics_json.recall} color="bg-indigo-500" />
                      <MetricProgress label="Precision" val={getProductionModel()!.metrics_json.precision} color="bg-emerald-500" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center py-6 text-center text-text-muted">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm font-semibold text-text">No Model in Production</p>
                  <p className="text-xs mt-1">Predictions will fallback to latest staging model version.</p>
                </div>
              )}
            </div>

            {/* Best Staging Candidate */}
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-secondary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg tracking-wider">
                Latest Candidate
              </div>

              {getStagingModels().length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Staging Candidate</span>
                    <h3 className="font-extrabold text-xl text-text mt-1">{getStagingModels()[0].version}</h3>
                    <p className="text-xs text-text-muted mt-1">Run ID: {getStagingModels()[0].run_id.slice(0, 16)}...</p>
                  </div>

                  {getStagingModels()[0].metrics_json && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
                      <MetricProgress label="F1-Score" val={getStagingModels()[0].metrics_json.f1} color="bg-secondary" />
                      <MetricProgress label="ROC-AUC" val={getStagingModels()[0].metrics_json.roc_auc} color="bg-secondary" />
                      <MetricProgress label="Recall" val={getStagingModels()[0].metrics_json.recall} color="bg-indigo-500" />
                      <MetricProgress label="Precision" val={getStagingModels()[0].metrics_json.precision} color="bg-emerald-500" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center py-6 text-center text-text-muted">
                  <Info className="w-10 h-10 mx-auto mb-2 text-text-muted" />
                  <p className="text-sm font-semibold">No Staging Models</p>
                  <p className="text-xs mt-1">All trained models are archived or in production.</p>
                </div>
              )}
            </div>
          </div>

          {/* Model Registry Version History Table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-white flex justify-between items-center">
              <h3 className="font-bold text-md text-text">Version Catalog</h3>
            </div>
            
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead className="bg-background font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Version</th>
                  <th className="px-6 py-3">Register Date</th>
                  <th className="px-6 py-3">F1-Score</th>
                  <th className="px-6 py-3">ROC-AUC</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions (Admins)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-background/20">
                    <td className="px-6 py-4 font-bold text-text">
                      {m.version}
                    </td>
                    <td className="px-6 py-4 text-text-muted flex items-center mt-1"><Calendar size={12} className="mr-1.5" /> {new Date(m.registered_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-text">{m.metrics_json?.f1.toFixed(4) || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-text">{m.metrics_json?.roc_auc.toFixed(4) || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                        m.status === 'Production'
                          ? 'bg-primary/5 text-primary border-primary/20'
                          : m.status === 'Staging'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <div className="flex items-center space-x-2">
                          {m.status !== 'Production' && (
                            <button
                              onClick={() => handlePromote(m.version, 'Production')}
                              className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-2.5 py-1 rounded transition duration-150 flex items-center"
                            >
                              <ArrowUpRight size={10} className="mr-0.5" /> Depl. Prod
                            </button>
                          )}
                          {m.status !== 'Staging' && (
                            <button
                              onClick={() => handlePromote(m.version, 'Staging')}
                              className="bg-white border border-border hover:bg-background text-text text-[10px] font-bold px-2.5 py-1 rounded transition duration-150 flex items-center"
                            >
                              Set Staging
                            </button>
                          )}
                          {m.status !== 'Archived' && (
                            <button
                              onClick={() => handlePromote(m.version, 'Archived')}
                              className="bg-white border border-border hover:text-red-500 text-text-muted text-[10px] font-bold px-2.5 py-1 rounded transition duration-150 flex items-center"
                            >
                              <Archive size={10} className="mr-0.5" /> Archive
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-text-muted italic">ReadOnly (Requires Admin)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
