# PredictWise AI: Corporate Customer Churn MLOps Platform

## Enterprise-Grade End-to-End MLOps Platform for Intelligent Customer Retention

PredictWise AI is a production-ready, full-stack MLOps platform designed to predict customer churn, explain prediction decisions, monitor model reliability, detect data drift, and continuously improve model performance through automated retraining.

The platform replicates a real-world enterprise machine learning environment by integrating modern frontend technologies, scalable backend services, automated machine learning pipelines, experiment tracking, model registries, object storage, monitoring systems, and business reporting tools.

Core capabilities include automated Optuna hyperparameter optimization, MLflow experiment tracking, SHAP-based explainable AI, Evidently AI drift detection, background retraining workflows, Prometheus telemetry, and Grafana observability dashboards.

---

# System Architecture

PredictWise AI follows a microservices-based architecture orchestrated using Docker Compose.

<img width="1024" height="1024" alt="predictwise_architecture" src="https://github.com/user-attachments/assets/c69d8ba1-a2e2-4d62-89d3-87350a008e95" />

---

# Architectural Layers

## Client Layer – React Frontend

The client layer provides a responsive enterprise dashboard where administrators and business users can interact with the system.

Features:

- Secure login and JWT authentication management.
- Customer churn prediction interface.
- Single and batch CSV prediction workflows.
- Dataset management and upload capabilities.
- Interactive dashboards and analytics.
- Model experiment visualization.
- Performance graphs and business insights.
- Communication with the FastAPI backend through secured REST APIs.

---

## Gateway Layer – FastAPI Backend

The FastAPI service acts as the central gateway responsible for business logic, API routing, and ML orchestration.

Responsibilities:

- REST API request handling.
- JWT authentication and authorization validation.
- Role-Based Access Control (RBAC).
- Single and batch prediction endpoints.
- Machine learning inference pipelines.
- SHAP explainability generation.
- Automated retraining schedules.
- PDF and Excel report generation.
- Integration with PostgreSQL, MinIO, MLflow, and monitoring services.

---

## Data and Model Registry Layer

### PostgreSQL Database

Stores:

- User profiles and authentication records.
- User roles and permissions.
- Prediction history.
- Activity and audit logs.
- Model deployment metadata.

### MinIO Object Storage

Acts as an S3-compatible storage service for:

- Customer datasets.
- Processed CSV files.
- Trained machine learning artifacts.
- Model serialization files.
- Generated reports.
- Evidently AI drift analysis reports.

<img width="1470" height="882" alt="MinIO Object Storage Console" src="https://github.com/user-attachments/assets/29329cdb-e29c-44ac-8e16-8c6edc2b3d0d" />


### MLflow Tracking Server

Responsible for:

- Experiment tracking.
- Hyperparameter logging.
- Model metric comparison.
- Model versioning.
- Model lifecycle management.
- Production model registration.

<img width="1470" height="882" alt="MLflow Experiment Tracking" src="https://github.com/user-attachments/assets/b700dd99-1ffc-4880-aba7-ba6015cb7f13" />


---

## Observability Layer

### Prometheus

Collects real-time telemetry including:

- API request volume.
- Request latency histograms.
- Error rates.
- Prediction distribution statistics.
- Application health metrics.

<img width="1470" height="883" alt="Prometheus Telemetry Gateway" src="https://github.com/user-attachments/assets/9fa9d681-bf34-4ee8-a45c-83959866b543" />


### Grafana

Provides visualization dashboards for:

- API performance.
- System diagnostics.
- Application health.
- Model prediction analytics.
- Historical telemetry insights.

<img width="1470" height="884" alt="Grafana Dashboards Portal" src="https://github.com/user-attachments/assets/5182c827-ff42-4092-9980-f9da6febfdc4" />


---

# Enterprise Features

## 1. Role-Based Access Control and JWT Security

The platform implements secure JWT-based authentication with multiple access levels.

### Business Users

Business users can:

- Generate single customer predictions.
- Upload batch datasets.
- Review churn analysis.
- Download business reports.
- Access prediction history.

### Administrators

Administrators have complete platform access including:

- ML retraining operations.
- Experiment management.
- System telemetry dashboards.
- Activity logs.
- Drift diagnostics.
- Administrative controls.

---

# 2. Automated Machine Learning Pipeline and Optuna Optimization

The training pipeline performs automated hyperparameter optimization using Optuna.

Supported algorithms:

- XGBoost
- LightGBM
- Random Forest

The system executes a 40-trial hyperparameter search and automatically records:

- Training configurations.
- Model parameters.
- Accuracy scores.
- Precision scores.
- Recall scores.
- F1-Score.
- ROC-AUC scores.
- Model artifacts.

All experiments are stored and versioned through MLflow Model Registry.

---

# 3. Explainable AI and Retention Intelligence

PredictWise AI uses SHAP (SHapley Additive Explanations) to provide transparent and interpretable predictions.

Capabilities:

- Calculates feature importance for every customer prediction.
- Identifies positive and negative churn factors.
- Provides customer-specific explanations.
- Generates automated retention recommendations.

Example retention actions:

- Contract upgrade recommendations.
- Priority customer support escalation.
- Personalized discount strategies.
- Customer engagement improvement suggestions.

---

# 4. Statistical Drift Monitoring and Automated Retraining

To maintain model reliability in production, the platform continuously monitors incoming data.

Features:

- Evidently AI drift analysis.
- Kolmogorov-Smirnov statistical testing.
- Continuous feature distribution monitoring.
- Scheduled background drift audits.
- Automatic retraining when drift exceeds 30%.

The retraining lifecycle runs through APScheduler background services.

---

# 5. Corporate Reporting and Analytics

PredictWise AI provides enterprise reporting capabilities.

Supported reports:

## PDF Customer Audit Reports

Generated using ReportLab and include:

- Customer information.
- Churn probability.
- SHAP explanations.
- Retention recommendations.

## Excel Executive Reports

Generated using OpenPyXL and include:

- Business analytics.
- Churn statistics.
- Prediction summaries.
- Customer trend analysis.

---

# Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, Axios |
| Backend | FastAPI, Python 3.10, SQLAlchemy, PostgreSQL, Uvicorn, APScheduler |
| Machine Learning & MLOps | XGBoost, LightGBM, Scikit-Learn, Optuna, SHAP, Evidently AI, MLflow |
| Infrastructure | Docker, Docker Compose, MinIO S3 Object Storage |
| Monitoring | Prometheus, Grafana |
| Reporting | ReportLab, OpenPyXL |

---

# Software Requirements

Before running the project, ensure the following dependencies are installed:

- Docker Engine v20.10.0 or higher.
- Docker Compose v2.0.0 or higher.
- Python 3.10 or higher (optional for local scripts).
- Node.js v18 or higher and npm (optional for running frontend locally).

---

# Installation and Deployment Guide

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/PredictWise-AI.git

cd PredictWise-AI
```

---

## 2. Start the Complete MLOps Stack

Build and launch all services using Docker Compose:

```bash
docker compose up --build -d
```

The command automatically starts:

- React Frontend.
- FastAPI Backend.
- PostgreSQL Database.
- MLflow Tracking Server.
- MinIO Object Storage.
- Prometheus Monitoring.
- Grafana Dashboards.

---

# Automatic Initialization Workflow

During the first application startup, the platform automatically executes an initialization lifecycle:

- Creates PostgreSQL schemas and tables.
- Creates the default administrator account.
- Generates initial customer datasets.
- Executes Optuna hyperparameter tuning.
- Selects the best-performing model.
- Registers the model into MLflow.
- Promotes the best model to the Production stage.
- Populates prediction history for dashboard analytics.

---

# Local Service Endpoints

| Service | URL | Credentials | Purpose |
|---|---|---|---|
| PredictWise AI Dashboard | http://localhost:5174 | admin@predictwise.com / AdminPassword123! | React web application |
| FastAPI API Documentation | http://localhost:8000/docs | JWT Authentication Required | REST API explorer |
| MLflow Tracking Server | http://localhost:5001 | No credentials required | Model registry and experiments |
| MinIO Object Console | http://localhost:9001 | minioadmin / minioadmin | Object storage management |
| Prometheus Monitoring | http://localhost:9090 | No credentials required | System metrics |
| Grafana Dashboards | http://localhost:3001 | admin / admin | Monitoring and analytics |

---

# Platform Interface Showcase

## Executive Intelligence Dashboard

Displays customer KPIs, churn risk distribution, geographic analysis, billing insights, and overall business statistics.

<img width="1470" height="881" alt="Customer Dashobard" src="https://github.com/user-attachments/assets/c52f85f3-55d5-40dc-9d68-10b76c901900" />


---

## Home Page

<img width="1470" height="885" alt="Home Page 1" src="https://github.com/user-attachments/assets/89371644-2715-48a0-89d3-a778439c7283" />

---

## Login page

<img width="1470" height="886" alt="Login Page" src="https://github.com/user-attachments/assets/99af684e-42ce-4394-b069-e0d9d28a6dd4" />


---

## Single Customer Prediction 

Provides customer churn probability, important contributing factors, and intelligent retention recommendations.

<img width="1470" height="887" alt="Single customer churn prediction" src="https://github.com/user-attachments/assets/d573f6d6-2637-442a-bd15-3fe9c75fdbd5" />

---

## Prediction History

<img width="1470" height="883" alt="Prediction history" src="https://github.com/user-attachments/assets/5815290c-6c3b-4d57-b7cb-7586a3128fc3" />

---

## Data Drift Report

<img width="1470" height="883" alt="Data Drift Report" src="https://github.com/user-attachments/assets/38020a12-31c6-4113-a819-8a8ef8ce3b76" />


---

## ML Pipeline

<img width="1470" height="881" alt="ML Pipeline (Admin)" src="https://github.com/user-attachments/assets/98683617-e10f-487c-b943-3e4640f0128f" />


---

## Validation Metrics Comparison

<img width="1470" height="886" alt="Validation Metrics Comparison" src="https://github.com/user-attachments/assets/b30b482e-2f74-45ba-a970-b599915d8ab5" />

---

## Model Registry

<img width="1470" height="884" alt="Model Registry" src="https://github.com/user-attachments/assets/99c54a0f-8d68-4b2b-994b-0a9769772196" />

---

## Reports and Downloads

<img width="1470" height="882" alt="Reports and Downloads" src="https://github.com/user-attachments/assets/40acf1f3-3f97-4089-8a5b-2e23bfadc4b2" />

---

## Customer Audit Report PDF

<img width="681" height="742" alt="Customer Audit Report PDF" src="https://github.com/user-attachments/assets/13e0ba9f-a1db-4a60-ac34-ae1ba551e673" />

---

## Monitoring

<img width="1470" height="884" alt="Monitoring" src="https://github.com/user-attachments/assets/1c3fcc29-7b5e-4209-95bd-5538c5618926" />

---

# Why PredictWise AI Represents a Production MLOps System

Unlike traditional machine learning projects that only focus on training a model, PredictWise AI implements the complete enterprise machine learning lifecycle:

```
Data Collection
       |
       ▼
Data Validation and Feature Engineering
       |
       ▼
Model Training and Optuna Optimization
       |
       ▼
MLflow Experiment Tracking and Registry
       |
       ▼
Model Deployment Through FastAPI
       |
       ▼
Monitoring with Prometheus and Grafana
       |
       ▼
Drift Detection with Evidently AI
       |
       ▼
Automated Model Retraining
```

The platform demonstrates production-level capabilities including:

- Full-stack AI application development.
- Enterprise microservice architecture.
- Automated machine learning pipelines.
- Experiment tracking and model lifecycle management.
- Explainable AI.
- Continuous model monitoring.
- Automated retraining workflows.
- Secure authentication and RBAC.
- Real-time observability.
- Containerized deployment.

---

# Author

Chaitanya Nagpure

Machine Learning Engineer focused on building scalable AI systems, production-grade MLOps pipelines, and intelligent full-stack applications.
