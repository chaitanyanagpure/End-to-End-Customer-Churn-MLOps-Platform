import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  Shield, 
  ExternalLink, 
  Database,
  Layers,
  HelpCircle,
  HardDrive
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  const services = [
    {
      name: "MLflow Experiment Tracking",
      description: "Manage classification pipelines, inspect hyperparameters sweeps, and download logged artifacts.",
      url: "http://localhost:5001",
      icon: Layers,
      color: "bg-primary/10 text-primary"
    },
    {
      name: "MinIO Object Storage Console",
      description: "Inspect uploaded datasets, trained model pickles, and generated business reports.",
      url: "http://localhost:9001",
      icon: HardDrive,
      color: "bg-amber-100 text-amber-700"
    },
    {
      name: "Prometheus Telemetry Gateway",
      description: "Inspect active server latencies, scrape logs, and query HTTP count telemetry.",
      url: "http://localhost:9090",
      icon: Database,
      color: "bg-red-100 text-red-700"
    },
    {
      name: "Grafana Dashboards Portal",
      description: "Visualize continuous predictions history and CPU performance charts.",
      url: "http://localhost:3001",
      icon: SettingsIcon,
      color: "bg-secondary/10 text-secondary"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Profile info */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-md text-text flex items-center mb-4">
            <User size={16} className="mr-2 text-primary" />
            <span>Profile Settings</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-background border border-border flex items-center space-x-3">
              <User size={16} className="text-text-muted shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Full Name</div>
                <div className="font-semibold text-text mt-0.5">{user?.full_name}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border flex items-center space-x-3">
              <Mail size={16} className="text-text-muted shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Email Address</div>
                <div className="font-semibold text-text mt-0.5">{user?.email}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border flex items-center space-x-3">
              <Shield size={16} className="text-text-muted shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Account Role</div>
                <div className="font-semibold text-text mt-0.5">{user?.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: MLOps Stack links */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-md text-text flex items-center mb-4">
            <SettingsIcon size={16} className="mr-2 text-primary" />
            <span>Auxiliary MLOps Tooling Links</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <div key={svc.name} className="p-4 rounded-xl border border-border hover:border-primary/20 transition-all bg-background/50 flex flex-col justify-between h-48">
                  <div className="space-y-2">
                    <div className={`${svc.color} p-2 rounded-lg w-fit`}>
                      <Icon size={18} />
                    </div>
                    <h4 className="font-bold text-xs text-text">{svc.name}</h4>
                    <p className="text-[10px] text-text-muted leading-relaxed">{svc.description}</p>
                  </div>
                  <div className="pt-3 border-t border-border/40 mt-3 flex justify-end">
                    <a 
                      href={svc.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline text-[10px] font-semibold flex items-center space-x-1"
                    >
                      <span>Launch Dashboard</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
