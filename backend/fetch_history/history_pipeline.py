"""
Pipeline: fetch → features → train/load → predict today
"""
import argparse, os, subprocess, sys
import torch
import pandas as pd
from train_model import GRURegressor, FEATURES, SEQ_LEN, THRESH_MULT
import joblib

def predict_today(symbol, stock_dir):
    model_path = os.path.join(stock_dir, f"{symbol}_reg_model.pth")
    scaler_path = os.path.join(stock_dir, f"{symbol}_scaler.save")
    features_file = os.path.join(stock_dir, f"{symbol}_features_reg.csv")

    if not os.path.exists(model_path) or not os.path.exists(features_file) or not os.path.exists(scaler_path):
        print("❌ Model, scaler, or features file not found. Cannot predict today.")
        return

    # Load CSV
    df = pd.read_csv(features_file, parse_dates=["Date"], index_col="Date")

    # Load scaler
    scaler = joblib.load(scaler_path)

    # Load model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = GRURegressor(len(FEATURES)).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    # Prepare last SEQ_LEN days
    last_seq = scaler.transform(df[FEATURES].iloc[-SEQ_LEN:])
    last_seq_tensor = torch.tensor(last_seq, dtype=torch.float32).unsqueeze(0).to(device)

    with torch.no_grad():
        pred_today = model(last_seq_tensor).item()

    atr_today = df["ATR_pct"].iloc[-1]

    if pred_today > THRESH_MULT * atr_today:
        return "BUY"
    elif pred_today < -THRESH_MULT * atr_today:
        return "SELL"
    else:
        return "HOLD"

def run_pipeline(symbol):
    symbol = symbol.upper()
    stock_dir = f"stocks_data/{symbol}"
    os.makedirs(stock_dir, exist_ok=True)

    print(f"🚀 Pipeline: {symbol}")

    model_path = os.path.join(stock_dir, f"{symbol}_reg_model.pth")

    # Always run fetch and features
    for script in ["fetch_data.py", "features.py"]:
        cmd = [sys.executable, script, symbol, stock_dir]
        print(f"  📥 {script}")
        subprocess.run(cmd, check=True)
        print(f"  ✅ {script}")

    # Train only if model does not exist
    if os.path.exists(model_path):
        print(f"🔹 Model already exists at {model_path}, skipping training.")
    else:
        cmd = [sys.executable, "train_model.py", symbol, stock_dir]
        print(f"  📥 train_model.py")
        subprocess.run(cmd, check=True)
        print(f"  ✅ train_model.py")

    # Predict today
    decision_today = predict_today(symbol, stock_dir)
    
    # Send only the decision to frontend
    print(decision_today)  

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol")
    args = parser.parse_args()
    run_pipeline(args.symbol)
