import argparse, yfinance as yf, pandas as pd, sys
import os

def main(symbol, output_dir):
    print(f"Fetching 5 years data for {symbol}...")
    
    df = yf.download(symbol, period="5y", interval="1d", progress=False)
    
    if df.empty:
        print(f"No data for {symbol}")
        return
    
    if df.columns.nlevels > 1:
        df.columns = df.columns.droplevel(1)
    
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
    df.sort_index(inplace=True)
    
    output_file = os.path.join(output_dir, f"{symbol}_data.csv")
    df.to_csv(output_file)
    print(f"[OK] Saved: {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol")
    parser.add_argument("output_dir")
    args = parser.parse_args()
    main(args.symbol, args.output_dir)