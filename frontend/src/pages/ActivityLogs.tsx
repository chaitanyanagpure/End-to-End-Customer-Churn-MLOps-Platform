import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ActivityLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  History, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  Clock, 
  User, 
  Network 
} from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const response = await api.get<ActivityLog[]>('/logs');
      setLogs(response.data);
    } catch (err) {
      console.error("Failed to load activity logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [isAdmin]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) || 
                          (log.user_id && log.user_id.toLowerCase().includes(search.toLowerCase())) ||
                          log.action.toLowerCase().includes(search.toLowerCase());
                          
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  // Unique actions list for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center text-text-muted max-w-lg mx-auto mt-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="font-bold text-lg text-text">Access Denied</h3>
        <p className="text-sm mt-2">The system activity audit trail logs contain sensitive database details and are limited to platform Admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Controls */}
      <div className="bg-white p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-1 items-center space-x-2 border border-border rounded-lg px-3 py-2 text-sm max-w-md bg-background">
          <Search size={16} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Search details, actions, users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 outline-none placeholder-text-muted text-xs"
          />
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-xs bg-white focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <button 
            onClick={fetchLogs}
            className="bg-white border border-border hover:bg-background text-text p-2 rounded-lg flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Logs</span>
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-white">
          <h3 className="font-bold text-md text-text flex items-center">
            <History size={16} className="mr-2 text-primary" />
            <span>Audit Trail Event Logs</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-text-muted">Fetching audit records database...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <p className="text-xs">No matching activity logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead className="bg-background font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action Tag</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Client IP</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-background/25">
                    <td className="px-6 py-4 text-text-muted font-medium whitespace-nowrap flex items-center mt-1">
                      <Clock size={12} className="mr-1.5" />
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text whitespace-nowrap">
                      <span className="flex items-center">
                        <User size={12} className="mr-1 text-primary shrink-0" />
                        {log.user_id ? log.user_id : 'system'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.action.includes('SUCCESS') || log.action.includes('REGISTER') || log.action.includes('LOGIN')
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : log.action.includes('FAILED') || log.action.includes('ALERT')
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-primary/5 text-primary border-primary/10'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted leading-relaxed min-w-[250px]">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 font-mono text-text-muted whitespace-nowrap">
                      <span className="flex items-center">
                        <Network size={12} className="mr-1 shrink-0" />
                        {log.ip_address}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
