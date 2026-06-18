import pandas as pd
import numpy as np
import uuid

def generate_synthetic_churn_data(num_records: int = 2000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    
    # 1. Base client identifiers
    customer_ids = [f"CUST-{uuid.uuid4().hex[:8].upper()}" for _ in range(num_records)]
    
    # 2. Demographic features
    ages = np.random.randint(18, 75, size=num_records)
    genders = np.random.choice(["Male", "Female"], size=num_records, p=[0.49, 0.51])
    locations = np.random.choice(["New York", "Los Angeles", "Chicago", "Miami", "Houston"], size=num_records)
    
    # 3. Account features
    subscription_types = np.random.choice(["Basic", "Standard", "Premium"], size=num_records, p=[0.4, 0.45, 0.15])
    contract_durations = np.random.choice([1, 12, 24], size=num_records, p=[0.35, 0.45, 0.2]) # monthly, annual, biennial
    payment_histories = np.random.choice(["On Time", "Delayed", "Missed"], size=num_records, p=[0.75, 0.18, 0.07])
    
    # 4. Activity & engagement metrics
    support_tickets = np.random.poisson(lam=1.5, size=num_records) # average 1.5 tickets
    customer_engagement = np.random.randint(1, 6, size=num_records) # engagement score 1-5
    
    # 5. Financial metrics
    # base charge depending on subscription tier
    base_charges = {"Basic": 29.99, "Standard": 79.99, "Premium": 149.99}
    monthly_charges = np.array([base_charges[sub] for sub in subscription_types])
    # add minor random variance to monthly charges
    monthly_charges += np.random.normal(0, 5, size=num_records)
    monthly_charges = np.round(np.clip(monthly_charges, 15.00, 199.99), 2)
    
    # Total charges based on contract months active + noise
    months_active = np.random.randint(1, 36, size=num_records)
    total_charges = monthly_charges * months_active
    total_charges += np.random.normal(0, 50, size=num_records)
    total_charges = np.round(np.clip(total_charges, monthly_charges, 8000.00), 2)
    
    # 6. Define Churn Logic (Probability based on inputs)
    # Logit formula
    # - Low engagement increases churn
    # - High support tickets increases churn
    # - Delayed/Missed payments increases churn
    # - Short contract (1 month) increases churn
    # - Premium subscription with low engagement increases churn
    # - Higher age slightly increases churn
    
    logit = (
        -1.5 
        - 0.6 * customer_engagement 
        + 0.5 * support_tickets 
        + 1.2 * (payment_histories == "Missed").astype(int)
        + 0.6 * (payment_histories == "Delayed").astype(int)
        + 1.0 * (contract_durations == 1).astype(int)
        - 0.4 * (contract_durations == 24).astype(int)
        + 0.01 * (ages - 40)
        + 0.005 * (monthly_charges - 60)
    )
    
    # convert logit to probability
    churn_prob = 1 / (1 + np.exp(-logit))
    # generate binary churn target
    churn = np.random.binomial(1, churn_prob)
    
    # Create DataFrame
    df = pd.DataFrame({
        "customer_id": customer_ids,
        "age": ages,
        "gender": genders,
        "location": locations,
        "subscription_type": subscription_types,
        "monthly_charges": monthly_charges,
        "total_charges": total_charges,
        "contract_duration": contract_durations,
        "customer_engagement": customer_engagement,
        "support_tickets": support_tickets,
        "payment_history": payment_histories,
        "churn": churn
    })
    
    return df

def adapt_kaggle_telco_csv(df: pd.DataFrame) -> pd.DataFrame:
    # Check if this is the standard Kaggle/IBM Telco dataset
    # Standard indicators: 'customerID' or 'tenure' or 'MonthlyCharges' present
    has_kaggle_cols = any(col in df.columns for col in ["customerID", "MonthlyCharges", "TotalCharges", "tenure"])
    
    if not has_kaggle_cols:
        return df
        
    df = df.copy()
    np.random.seed(42) # For reproducible random fillings
    
    # Rename matching columns
    rename_map = {
        "customerID": "customer_id",
        "MonthlyCharges": "monthly_charges",
        "TotalCharges": "total_charges",
        "tenure": "contract_duration"
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
    
    # Ensure numeric columns are parsed properly
    if "monthly_charges" in df.columns:
        df["monthly_charges"] = pd.to_numeric(df["monthly_charges"], errors="coerce").fillna(50.0)
    if "total_charges" in df.columns:
        # Clean total charges which might have empty spaces
        clean_total = df["total_charges"].astype(str).str.strip().replace("", "0")
        df["total_charges"] = pd.to_numeric(clean_total, errors="coerce").fillna(0.0)
        
    # Standardize/Map fields
    if "gender" in df.columns:
        df["gender"] = df["gender"].map({"Female": "Female", "Male": "Male"}).fillna("Male")
        
    if "Contract" in df.columns and "contract_duration" not in df.columns:
        df["contract_duration"] = df["Contract"].map({"Month-to-month": 1, "One year": 12, "Two year": 24}).fillna(12)
    elif "contract_duration" in df.columns:
        # If contract_duration is present (e.g. tenure), map it to standard durations (1, 12, 24)
        df["contract_duration"] = df["contract_duration"].apply(lambda x: 1 if x <= 6 else 24 if x >= 18 else 12)

    if "InternetService" in df.columns:
        df["subscription_type"] = df["InternetService"].map({"Fiber optic": "Premium", "DSL": "Standard", "No": "Basic"}).fillna("Standard")
    elif "subscription_type" not in df.columns:
        df["subscription_type"] = np.random.choice(["Basic", "Standard", "Premium"], size=len(df), p=[0.4, 0.45, 0.15])
        
    if "PaymentMethod" in df.columns:
        df["payment_history"] = df["PaymentMethod"].apply(lambda x: "On Time" if "automatic" in str(x).lower() else np.random.choice(["On Time", "Delayed", "Missed"], p=[0.6, 0.3, 0.1]))
    elif "payment_history" not in df.columns:
        df["payment_history"] = np.random.choice(["On Time", "Delayed", "Missed"], size=len(df), p=[0.75, 0.18, 0.07])
        
    if "Churn" in df.columns and "churn" not in df.columns:
        df["churn"] = df["Churn"].map({"Yes": 1, "No": 0}).fillna(0).astype(int)

    # Generate missing columns that our model expects
    if "age" not in df.columns:
        df["age"] = np.random.randint(18, 75, size=len(df))
        
    if "location" not in df.columns:
        df["location"] = np.random.choice(["New York", "Los Angeles", "Chicago", "Miami", "Houston"], size=len(df))
        
    if "customer_engagement" not in df.columns:
        df["customer_engagement"] = np.random.randint(1, 6, size=len(df))
        
    if "support_tickets" not in df.columns:
        tickets = np.random.poisson(lam=1.5, size=len(df))
        df["support_tickets"] = np.clip(tickets, 0, 5)

    return df

if __name__ == "__main__":
    df = generate_synthetic_churn_data(1000)
    df.to_csv("churn_synthetic.csv", index=False)
    print(f"Generated synthetic dataset with {len(df)} rows. Churn rate: {df['churn'].mean():.2%}")
