"""
Pipeline: fetch → features → train
Always full run
"""
import argparse, os, subprocess, sys

def run_pipeline(symbol):
    symbol = symbol.upper()
    stock_dir = f"stocks_data/{symbol}"
    os.makedirs(stock_dir, exist_ok=True)
    
    print(f"🚀 Pipeline: {symbol}")
    
    for script in ["fetch_data.py", "features.py", "train_model.py"]:
        cmd = [sys.executable, script, symbol, stock_dir]
        print(f"  📥 {script}")
        subprocess.run(cmd, check=True)
        print(f"  ✅ {script}")
    
    print(f"\n🎉 COMPLETE: {stock_dir}/")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol")
    args = parser.parse_args()
    run_pipeline(args.symbol)
