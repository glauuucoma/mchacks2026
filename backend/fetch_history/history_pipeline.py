"""
Pipeline: fetch → features → train/load → predict today
"""
import argparse, os, subprocess, sys
import torch
import pandas as pd
from .train_model import GRURegressor, FEATURES, SEQ_LEN, THRESH_MULT
import joblib

def predict_today(symbol, stock_dir):
    model_path = os.path.join(stock_dir, f"{symbol}_reg_model.pth")
    scaler_path = os.path.join(stock_dir, f"{symbol}_scaler.save")
    features_file = os.path.join(stock_dir, f"{symbol}_features_reg.csv")

    # If any file is missing, run the pipeline to generate them
    if not (os.path.exists(model_path) and os.path.exists(features_file) and os.path.exists(scaler_path)):
        print(f"[WARNING] Missing files for {symbol}. Running pipeline...")
        run_pipeline(symbol, stock_dir)
        # After running, check again
        if not (os.path.exists(model_path) and os.path.exists(features_file) and os.path.exists(scaler_path)):
            raise FileNotFoundError(f"Model, scaler, or features file not found for {symbol} after running pipeline. Cannot predict today.")

    # Load CSV
    try:
        df = pd.read_csv(features_file, parse_dates=["Date"], index_col="Date")
        if df.empty:
            raise ValueError(f"Features file for {symbol} is empty")
    except Exception as e:
        raise FileNotFoundError(f"Failed to load features file for {symbol}: {str(e)}")

    # Load scaler
    try:
        scaler = joblib.load(scaler_path)
    except Exception as e:
        raise FileNotFoundError(f"Failed to load scaler for {symbol}: {str(e)}")

    # Load model
    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = GRURegressor(len(FEATURES)).to(device)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval()
    except Exception as e:
        raise FileNotFoundError(f"Failed to load model for {symbol}: {str(e)}")

    # Prepare last SEQ_LEN days
    try:
        if len(df) < SEQ_LEN:
            raise ValueError(f"Insufficient data for {symbol}: need {SEQ_LEN} days, have {len(df)}")
        last_seq = scaler.transform(df[FEATURES].iloc[-SEQ_LEN:])
        last_seq_tensor = torch.tensor(last_seq, dtype=torch.float32).unsqueeze(0).to(device)
    except Exception as e:
        raise ValueError(f"Failed to prepare data for {symbol}: {str(e)}")

    # Run model prediction
    try:
        with torch.no_grad():
            pred_today = model(last_seq_tensor).item()
    except Exception as e:
        raise RuntimeError(f"Model prediction failed for {symbol}: {str(e)}")

    # Get ATR for threshold comparison
    try:
        atr_today = df["ATR_pct"].iloc[-1]
    except Exception as e:
        raise ValueError(f"Failed to get ATR for {symbol}: {str(e)}")

    if pred_today > THRESH_MULT * atr_today:
        return "BUY"
    elif pred_today < -THRESH_MULT * atr_today:
        return "SELL"
    else:
        return "HOLD"

def run_pipeline(symbol, stock_dir=None):
    symbol = symbol.upper()
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # If stock_dir is not provided, use default relative path
    if stock_dir is None:
        stock_dir = os.path.join(script_dir, "stocks_data", symbol)
    else:
        # Ensure stock_dir is absolute
        if not os.path.isabs(stock_dir):
            stock_dir = os.path.abspath(stock_dir)
    
    os.makedirs(stock_dir, exist_ok=True)

    print(f"[PIPELINE] Starting pipeline for {symbol}")
    print(f"[INFO] Stock directory: {stock_dir}")

    model_path = os.path.join(stock_dir, f"{symbol}_reg_model.pth")

    # Always run fetch and features - use absolute paths to scripts
    for script_name in ["fetch_data.py", "features.py"]:
        script_path = os.path.join(script_dir, script_name)
        if not os.path.exists(script_path):
            print(f"[ERROR] Script not found: {script_path}")
            continue
        cmd = [sys.executable, script_path, symbol, stock_dir]
        print(f"  [RUNNING] {script_name}")
        try:
            result = subprocess.run(cmd, check=True, cwd=script_dir, capture_output=True, text=True)
            print(f"  [OK] {script_name} completed")
        except subprocess.CalledProcessError as e:
            print(f"  [ERROR] {script_name} failed: {e}")
            print(f"  Error output: {e.stderr}")
            raise

    # Train only if model does not exist
    if os.path.exists(model_path):
        print(f"[INFO] Model already exists at {model_path}, skipping training.")
    else:
        train_script_path = os.path.join(script_dir, "train_model.py")
        if not os.path.exists(train_script_path):
            print(f"[ERROR] Training script not found: {train_script_path}")
        else:
            cmd = [sys.executable, train_script_path, symbol, stock_dir]
            print(f"  [RUNNING] train_model.py")
            try:
                subprocess.run(cmd, check=True, cwd=script_dir, capture_output=True, text=True)
                print(f"  [OK] train_model.py completed")
            except subprocess.CalledProcessError as e:
                print(f"  [ERROR] train_model.py failed: {e}")
                print(f"  Error output: {e.stderr}")
                raise

    # Predict today
    decision_today = predict_today(symbol, stock_dir)
    
    # Send only the decision to frontend
    print(decision_today)  

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol")
    args = parser.parse_args()
    run_pipeline(args.symbol)
