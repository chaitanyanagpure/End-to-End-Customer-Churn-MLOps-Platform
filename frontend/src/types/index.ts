export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'Admin' | 'Business User';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DatasetStats {
  missing_values: Record<string, number>;
  data_types: Record<string, string>;
  row_count: number;
  col_count: number;
  summary: Record<string, any>;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  version: string;
  s3_key: string;
  row_count: number;
  feature_count: number;
  schema_definition: Record<string, string> | null;
  descriptive_stats: DatasetStats | null;
  drift_report_s3_key: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface SHAPFeatureImpact {
  feature: string;
  impact: number;
  value: any;
}

export interface PredictionRecord {
  id: string;
  customer_id: string;
  age: number;
  gender: string;
  location: string;
  subscription_type: string;
  monthly_charges: number;
  total_charges: number;
  contract_duration: number;
  customer_engagement: number;
  support_tickets: number;
  payment_history: string;
  churn_probability: number;
  risk_category: 'Low' | 'Medium' | 'High';
  explanation_json: SHAPFeatureImpact[] | null;
  retention_suggestions: string[] | null;
  created_at: string;
}

export interface ModelMetadata {
  id: string;
  model_name: string;
  version: string;
  run_id: string;
  status: 'Archived' | 'Staging' | 'Production';
  metrics_json: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
  };
  hyperparams_json: Record<string, any>;
  registered_at: string;
  deployed_at: string | null;
}

export interface RetrainingJob {
  id: string;
  status: 'Pending' | 'Running' | 'Success' | 'Failed';
  trigger_type: 'Manual' | 'Scheduled';
  started_at: string;
  ended_at: string | null;
  logs_s3_key: string | null;
  error_message: string | null;
  created_model_version: string | null;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: string;
  ip_address: string | null;
  timestamp: string;
}

export interface FeatureDriftDetail {
  method: string;
  p_value: number;
  statistic: number;
  drift_detected: boolean;
}

export interface DriftReportOut {
  drift_detected: boolean;
  drift_ratio: number;
  drifted_features: string[];
  features: Record<string, FeatureDriftDetail> | null;
  message: string | null;
}

export interface BatchPredictionResponse {
  total_records: number;
  high_risk_count: number;
  average_churn_probability: number;
  predictions: PredictionRecord[];
  download_url: string | null;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  full_name: string;
  email: string;
  password: string;
}


