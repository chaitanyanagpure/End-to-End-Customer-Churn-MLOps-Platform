import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Cpu, 
  BarChart3, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Activity,
  Layers,
  Database,
  LineChart
} from 'lucide-react';

export const Landing: React.FC = () => {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background text-text selection:bg-primary/10 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-lg text-white">
              <Cpu size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-text">PredictWise <span className="text-primary">AI</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-semibold hover:text-primary transition-colors duration-200">
              Sign In
            </Link>
            <Link to="/register" className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36 bg-gradient-to-b from-white to-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-secondary/5 border border-secondary/20 px-3 py-1 rounded-full text-secondary text-sm font-semibold mb-6"
          >
            <Zap size={14} className="text-secondary" />
            <span>Next-Generation MLOps Platform</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-none text-text"
          >
            Enterprise Customer Churn Prediction <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Powered by Explainable AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-text-muted max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Identify high-risk accounts, trace decision rationales via SHAP explainer graphs, and trigger automated retraining pipelines to ensure high model stability.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <Link to="/register" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-lg shadow-sm font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-lg">
              <span>Deploy PredictWise Free</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white border border-border hover:bg-background text-text px-8 py-3.5 rounded-lg font-semibold flex items-center justify-center transition-all duration-200">
              Explore Live Demo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Highlights & Features */}
      <section className="py-24 bg-white border-t border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Standardized Machine Learning Operations</h2>
            <p className="text-text-muted mt-4">PredictWise AI unites data science experiments with reliable production infrastructure.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants} className="p-8 rounded-2xl border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg bg-background/50">
              <div className="bg-primary/10 text-primary p-3.5 rounded-xl w-fit mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="font-bold text-xl mb-3">SHAP Explanations</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Provide crystal-clear rationales for every single prediction, identifying the precise features driving customer retention risk.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-8 rounded-2xl border border-border hover:border-secondary/20 transition-all duration-300 hover:shadow-lg bg-background/50">
              <div className="bg-secondary/10 text-secondary p-3.5 rounded-xl w-fit mb-6">
                <RefreshCw size={24} />
              </div>
              <h3 className="font-bold text-xl mb-3">Automated Retraining</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Monitor data drift dynamically using Evidently AI and schedule model training jobs on newly ingested profiles automatically.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-8 rounded-2xl border border-border hover:border-accent/20 transition-all duration-300 hover:shadow-lg bg-background/50">
              <div className="bg-accent/10 text-accent p-3.5 rounded-xl w-fit mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-xl mb-3">Model Registry</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Promote models from Staging to Production, run side-by-side metric comparisons, and instantly rollback models to safeguard reliability.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MLOps Architecture Overview */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">System Blueprint</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-text mt-4">
                Enterprise-Ready Architecture Built for Scale
              </h2>
              <p className="text-text-muted mt-6 leading-relaxed">
                PredictWise AI wraps professional MLOps tools within a highly streamlined dashboard interface, ensuring smooth interaction for both analysts and engineering teams.
              </p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-accent/10 text-accent p-1 rounded-md mt-1"><Layers size={14} /></div>
                  <div>
                    <h4 className="font-semibold text-text">Optuna Auto-Tuning</h4>
                    <p className="text-xs text-text-muted">Optimizes hyperparameter sweeps for XGBoost, LightGBM, and Random Forest pipelines.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-accent/10 text-accent p-1 rounded-md mt-1"><Database size={14} /></div>
                  <div>
                    <h4 className="font-semibold text-text">Dataset Version Control</h4>
                    <p className="text-xs text-text-muted">Maintains clear record history on local S3-compatible stores with schema compliance checks.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-accent/10 text-accent p-1 rounded-md mt-1"><LineChart size={14} /></div>
                  <div>
                    <h4 className="font-semibold text-text">Prometheus & Grafana Monitoring</h4>
                    <p className="text-xs text-text-muted">Audits API response latencies, server errors, model health, and prediction metrics.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 w-full bg-white p-8 rounded-2xl border border-border shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center space-x-2">
                <Activity size={18} className="text-primary" />
                <span>Standardized MLOps Cycle</span>
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-background flex justify-between items-center">
                  <span className="text-sm font-semibold">1. Data Quality Check</span>
                  <span className="bg-accent text-white text-xs px-2.5 py-0.5 rounded-full">Evidently AI</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background flex justify-between items-center">
                  <span className="text-sm font-semibold">2. Hyperparameter Search</span>
                  <span className="bg-secondary text-white text-xs px-2.5 py-0.5 rounded-full">Optuna Sweep</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background flex justify-between items-center">
                  <span className="text-sm font-semibold">3. Model Validation</span>
                  <span className="bg-primary text-white text-xs px-2.5 py-0.5 rounded-full">F1-Score Check</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background flex justify-between items-center">
                  <span className="text-sm font-semibold">4. Experiment Tracking</span>
                  <span className="bg-indigo-600 text-white text-xs px-2.5 py-0.5 rounded-full">MLflow Registered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-white border-t border-border relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Prevent Customer Churn?
          </h2>
          <p className="text-text-muted mt-4 max-w-xl mx-auto">
            Create an account in seconds, upload your historic profiles list, and generate explanations.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/register" className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3.5 rounded-lg shadow-sm flex items-center space-x-2 transition-all duration-200 hover:shadow-lg">
              <span>Sign Up for PredictWise</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center">
          <span className="text-sm text-text-muted">© 2026 PredictWise AI Inc. All rights reserved.</span>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Architecture</a>
            <a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
