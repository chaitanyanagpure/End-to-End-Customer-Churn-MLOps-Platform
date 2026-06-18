import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { RetrainingJob, DatasetMetadata } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  RefreshCw, 
  Play, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Clock,
  Database,
  Layers,
  Terminal
} from 'lucide-react';

export const MLPipeline: React.FC = () => {
  const { isAdmin } = useAuth();
  
  const [jobs, setJobs] = useState<RetrainingJob[]>([]);
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newVersion, setNewVersion] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('');

  const fetchJobsAndDatasets = async () => {
    try {
      const [jobsRes, datasetsRes] = await Promise.all([
        api.get<RetrainingJob[]>('/pipeline/runs'),
        api.get<DatasetMetadata[]>('/datasets')
      ]);
      setJobs(jobsRes.data);
      setDatasets(datasetsRes.data);
      if (datasetsRes.data.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(datasetsRes.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load jobs/datasets", err);
      setError("Failed to coordinate pipeline settings. Check API gateway.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsAndDatasets();
  }, []);

  // Auto poll status if there are active runs
  useEffect(() => {
    const activeJobs = jobs.filter(j => j.status === 'Running' || j.status === 'Pending');
    if (activeJobs.length > 0) {
      const interval = setInterval(async () => {
        try {
          const response = await api.get<RetrainingJob[]>('/pipeline/runs');
          setJobs(response.data);
        } catch (err) {
          console.error("Polling jobs failed", err);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [jobs]);

  const handleSubmitRetrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newVersion) {
      setError('Please specify a model version (e.g., v2.0).');
      return;
    }

    setTriggerLoading(true);
    try {
      await api.post('/pipeline/train', {
        version: newVersion,
        dataset_id: selectedDatasetId || null
      });
      setNewVersion('');
      fetchJobsAndDatasets();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to trigger model retraining pipeline.');
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-text-muted text-sm font-normal">Trigger hyperparameter optimizations and monitor continuous training execution jobs.</p>
        <button 
          onClick={fetchJobsAndDatasets}
          className="bg-white border border-border hover:bg-background text-text p-2 rounded-lg flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Pipelines</span>
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
          <p className="text-text-muted text-sm font-medium">Loading execution logs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Retrain Trigger Dashboard Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
              <h3 className="font-bold text-md text-text mb-4 flex items-center">
                <Play size={16} className="mr-2 text-primary" />
                <span>ManualRetrain Trigger</span>
              </h3>

              {isAdmin ? (
                <form onSubmit={handleSubmitRetrain} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Target Model Version</label>
                    <input 
                      type="text" 
                      value={newVersion} 
                      onChange={(e) => setNewVersion(e.target.value)}
                      placeholder="e.g. v1.1, v_q3_retrained"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Training Source Dataset</label>
                    <select 
                      value={selectedDatasetId} 
                      onChange={(e) => setSelectedDatasetId(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {datasets.length === 0 ? (
                        <option value="">No datasets available</option>
                      ) : (
                        datasets.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.version} ({d.name})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={triggerLoading || datasets.length === 0}
                      className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                    >
                      {triggerLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          <span>Starting Pipeline...</span>
                        </>
                      ) : (
                        <>
                          <Activity size={16} />
                          <span>Run Training Pipeline</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center p-4 bg-background rounded-lg border border-border">
                  <span className="text-xs text-text-muted italic">ReadOnly Mode. Triggering model retraining requires Admin credentials.</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Job History Console */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-white flex justify-between items-center">
                <h3 className="font-bold text-md text-text flex items-center">
                  <Terminal size={16} className="mr-2 text-primary" />
                  <span>Retraining Execution Log</span>
                </h3>
              </div>

              {jobs.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  <p className="text-xs">No retraining execution jobs recorded.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-5 hover:bg-background/20 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-text font-mono truncate max-w-[120px]" title={job.id}>
                              ID: {job.id.slice(0, 8)}...
                            </span>
                            <span className="text-[10px] text-text-muted bg-background px-2 py-0.5 rounded-full border border-border font-medium">
                              {job.trigger_type}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted flex items-center mt-1">
                            <Clock size={10} className="mr-1" />
                            Started: {new Date(job.started_at).toLocaleString()}
                          </p>
                          {job.ended_at && (
                            <p className="text-[10px] text-text-muted flex items-center">
                              <Clock size={10} className="mr-1" />
                              Finished: {new Date(job.ended_at).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end space-y-1.5">
                          {job.status === 'Success' ? (
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px] font-bold flex items-center">
                              <CheckCircle size={10} className="mr-1" /> Success
                            </span>
                          ) : job.status === 'Running' ? (
                            <span className="bg-primary/5 text-primary px-2.5 py-0.5 rounded-full border border-primary/20 text-[10px] font-bold flex items-center">
                              <div className="w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1"></div> Running
                            </span>
                          ) : job.status === 'Failed' ? (
                            <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200 text-[10px] font-bold flex items-center">
                              <AlertCircle size={10} className="mr-1" /> Failed
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200 text-[10px] font-bold flex items-center">
                              Pending
                            </span>
                          )}
                          
                          {job.created_model_version && (
                            <span className="text-[10px] font-bold text-primary">Model: {job.created_model_version}</span>
                          )}
                        </div>
                      </div>

                      {/* Display error message if failed */}
                      {job.status === 'Failed' && job.error_message && (
                        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 text-[10px] text-red-800 font-mono whitespace-pre-wrap leading-normal">
                          <strong>Error Trace:</strong> {job.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
