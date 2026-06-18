import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DatasetMetadata, DriftReportOut } from '../types';
import { 
  Database, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  FileSpreadsheet, 
  Eye, 
  ArrowRight,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

export const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetMetadata | null>(null);
  const [driftReport, setDriftReport] = useState<DriftReportOut | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'stats' | 'drift'>('catalog');
  
  // Upload form state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [version, setVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch datasets on load
  const fetchDatasets = async () => {
    try {
      const response = await api.get<DatasetMetadata[]>('/datasets');
      setDatasets(response.data);
      if (response.data.length > 0 && !selectedDataset) {
        setSelectedDataset(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to load datasets", err);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  // Fetch drift report when dataset is selected
  useEffect(() => {
    if (selectedDataset) {
      const fetchDrift = async () => {
        try {
          const response = await api.get<DriftReportOut>(`/datasets/${selectedDataset.id}/drift`);
          setDriftReport(response.data);
        } catch (err) {
          console.error("Failed to fetch drift metrics", err);
          setDriftReport(null);
        }
      };
      fetchDrift();
    }
  }, [selectedDataset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // Auto-suggest version if empty
      if (!version) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
        setVersion(`v_${dateStr}_${Math.floor(Math.random() * 1000)}`);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!file || !version) {
      setUploadError('Please select a CSV file and specify a version.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);

    try {
      await api.post('/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadOpen(false);
      setVersion('');
      setFile(null);
      fetchDatasets();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-text-muted text-sm">Upload business datasets, check data quality stats, and audit concept drift.</p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm shadow-sm transition-all duration-150 shrink-0"
        >
          <Upload size={16} />
          <span>Upload Dataset</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all duration-150 ${
            activeTab === 'catalog' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Dataset Catalog
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all duration-150 ${
            activeTab === 'stats' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Data Quality & Stats
        </button>
        <button
          onClick={() => setActiveTab('drift')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all duration-150 ${
            activeTab === 'drift' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Data Drift Report
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Datasets Catalog List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-md text-text">Dataset Versions</h3>
            {datasets.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center text-text-muted">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-border" />
                <p className="text-sm">No datasets uploaded yet.</p>
              </div>
            ) : (
              datasets.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDataset(d)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                    selectedDataset?.id === d.id 
                      ? 'border-primary bg-primary/[0.02] shadow-sm' 
                      : 'border-border bg-white hover:border-text-muted'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm tracking-tight">{d.version}</span>
                    <span className="text-[10px] bg-background text-text-muted px-2 py-0.5 rounded-full font-mono">
                      {d.row_count} rows
                    </span>
                  </div>
                  <p className="text-xs text-text-muted truncate mt-1">{d.name}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-[10px] text-text-muted">
                    <span className="flex items-center"><Calendar size={10} className="mr-1" /> {new Date(d.created_at).toLocaleDateString()}</span>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDataset(d);
                        setActiveTab('stats');
                      }}
                      className="text-primary hover:underline flex items-center"
                    >
                      Analyze <ArrowRight size={10} className="ml-1" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Selected Dataset Details */}
          <div className="lg:col-span-2">
            {selectedDataset ? (
              <div className="bg-white rounded-xl border border-border p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-text">Version: {selectedDataset.version}</h3>
                  <p className="text-xs text-text-muted">File: {selectedDataset.name} | S3 key: {selectedDataset.s3_key}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Rows</span>
                    <div className="text-xl font-bold mt-1">{selectedDataset.row_count}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Feature Count</span>
                    <div className="text-xl font-bold mt-1">{selectedDataset.feature_count}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Drift Check</span>
                    <div className="mt-1 flex items-center">
                      {driftReport?.drift_detected ? (
                        <span className="bg-red-50 text-red-700 text-xs px-2.5 py-0.5 rounded-full border border-red-200 flex items-center font-semibold"><AlertTriangle size={12} className="mr-1" /> Drifted</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center font-semibold"><CheckCircle size={12} className="mr-1" /> Stable</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schema definition */}
                <div>
                  <h4 className="font-bold text-sm text-text mb-3 flex items-center"><Layers size={14} className="mr-1.5 text-primary" /> Feature Column Types</h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-background">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Column</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Type</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-border text-xs">
                        {selectedDataset.schema_definition && 
                          Object.entries(selectedDataset.schema_definition).map(([col, dtype]) => (
                            <tr key={col}>
                              <td className="px-4 py-2 font-mono font-semibold text-text">{col}</td>
                              <td className="px-4 py-2 text-text-muted">{dtype}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border p-12 text-center text-text-muted">
                <Database className="w-12 h-12 mx-auto mb-3 text-border animate-pulse" />
                <p>Please select or upload a dataset to begin your analysis.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-white rounded-xl border border-border p-6">
          {selectedDataset && selectedDataset.descriptive_stats ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-text">Dataset Statistics ({selectedDataset.version})</h3>
                <p className="text-xs text-text-muted">Review missing value audits and descriptive distributions.</p>
              </div>

              {/* Missing Values Table */}
              <div>
                <h4 className="font-bold text-sm text-text mb-3 flex items-center"><Info size={14} className="mr-1.5 text-primary" /> Null Value Audit</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedDataset.descriptive_stats.missing_values).map(([col, val]) => (
                    <div key={col} className="p-3 rounded-lg bg-background border border-border flex justify-between items-center text-xs">
                      <span className="font-mono font-semibold text-text">{col}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                        val > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                      }`}>
                        {val} nulls ({((val / selectedDataset.row_count) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats Table */}
              <div>
                <h4 className="font-bold text-sm text-text mb-3 flex items-center"><FileText size={14} className="mr-1.5 text-primary" /> Descriptive Metrics (Numerical Features)</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-background">
                      <tr className="text-xs text-text-muted font-bold uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Feature</th>
                        <th className="px-4 py-3 text-left">Mean</th>
                        <th className="px-4 py-3 text-left">Median</th>
                        <th className="px-4 py-3 text-left">Min</th>
                        <th className="px-4 py-3 text-left">Max</th>
                        <th className="px-4 py-3 text-left">Std Dev</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border text-xs">
                      {Object.entries(selectedDataset.descriptive_stats.summary)
                        .filter(([_, data]: any) => data.mean !== undefined)
                        .map(([col, data]: any) => (
                          <tr key={col}>
                            <td className="px-4 py-3 font-semibold font-mono text-text">{col}</td>
                            <td className="px-4 py-3 text-text-muted">{data.mean.toFixed(2)}</td>
                            <td className="px-4 py-3 text-text-muted">{data.median.toFixed(2)}</td>
                            <td className="px-4 py-3 text-text-muted">{data.min.toFixed(2)}</td>
                            <td className="px-4 py-3 text-text-muted">{data.max.toFixed(2)}</td>
                            <td className="px-4 py-3 text-text-muted">{data.std.toFixed(2)}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-text-muted py-12">
              <p>Please select a dataset to view descriptive statistics.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'drift' && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-6">
          {selectedDataset ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-lg text-text">Dataset Concept Drift Analysis</h3>
                  <p className="text-xs text-text-muted">Compares active version ({selectedDataset.version}) with the preceding catalog version.</p>
                </div>
                {selectedDataset.drift_report_s3_key && (
                  <a
                    href={`http://localhost:8000/api/v1/datasets/${selectedDataset.id}/report`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white border border-border hover:bg-background text-text text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm flex items-center space-x-1.5"
                  >
                    <Eye size={12} />
                    <span>Open HTML Report</span>
                  </a>
                )}
              </div>

              {driftReport ? (
                <div className="space-y-6">
                  {/* Summary Metric */}
                  <div className="p-4 rounded-xl border border-border bg-background flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-text">Overall Drift Ratio: {driftReport.drift_ratio.toFixed(1)}%</div>
                      <p className="text-xs text-text-muted mt-1">
                        {driftReport.drift_detected 
                          ? "CRITICAL: The proportion of drifted variables is above the 30% threshold. retraining is strongly recommended." 
                          : "SAFE: Divergence remains below training boundaries. model calibration is active."}
                      </p>
                    </div>
                    <div className="text-sm font-bold">
                      {driftReport.drift_detected ? (
                        <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200">Retrain Pipeline Recommended</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">System Healthy</span>
                      )}
                    </div>
                  </div>

                  {/* Feature wise status */}
                  {driftReport.features && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-background">
                          <tr className="text-xs text-text-muted font-bold uppercase tracking-wider">
                            <th className="px-4 py-3 text-left">Feature</th>
                            <th className="px-4 py-3 text-left">Audit Method</th>
                            <th className="px-4 py-3 text-left">Test Statistic</th>
                            <th className="px-4 py-3 text-left">p-value</th>
                            <th className="px-4 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border text-xs">
                          {Object.entries(driftReport.features).map(([col, data]) => (
                            <tr key={col}>
                              <td className="px-4 py-3 font-semibold font-mono text-text">{col}</td>
                              <td className="px-4 py-3 text-text-muted">{data.method}</td>
                              <td className="px-4 py-3 text-text-muted font-mono">{data.statistic.toFixed(4)}</td>
                              <td className="px-4 py-3 text-text-muted font-mono">{data.p_value.toExponential(2)}</td>
                              <td className="px-4 py-3">
                                {data.drift_detected ? (
                                  <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 font-semibold text-[10px]">Drifted</span>
                                ) : (
                                  <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100 font-semibold text-[10px]">Stable</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Embed HTML Report inside iframe */}
                  {selectedDataset.drift_report_s3_key && (
                    <div className="border border-border rounded-xl overflow-hidden mt-6 shadow-sm">
                      <div className="bg-background px-4 py-3 border-b border-border flex items-center justify-between">
                        <span className="text-xs font-bold text-text-muted">Interactive Evidently AI Dashboard</span>
                        <span className="text-[10px] text-text-muted">Loading live report...</span>
                      </div>
                      <iframe 
                        src={`http://localhost:8000/api/v1/datasets/${selectedDataset.id}/report`} 
                        title="Data Drift HTML Report"
                        className="w-full h-[600px] border-0"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-text-muted py-12">
                  <p>Calculating drift metrics...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-text-muted py-12">
              <p>Please select a dataset to view concept drift analysis.</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal Drawer */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75 p-4">
          <div className="bg-white rounded-xl border border-border shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-md text-text">Upload Dataset CSV</h3>
              <button onClick={() => setUploadOpen(false)} className="text-text-muted hover:text-text">✕</button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start space-x-2 text-xs">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Dataset Version</label>
                <input 
                  type="text" 
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v1.0, v2026_q2"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Select CSV File</label>
                <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-6 text-center cursor-pointer transition-all duration-150 relative">
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <Upload size={24} className="mx-auto mb-2 text-text-muted" />
                  <span className="text-xs font-medium text-text truncate block">
                    {file ? file.name : "Drag & drop file or click to select"}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-1">Requires customer churn schema fields</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="bg-white border border-border hover:bg-background px-4 py-2 rounded-lg text-sm font-semibold text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center space-x-1.5"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Submit</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
