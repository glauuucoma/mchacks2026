import argparse, yfinance as yf, pandas as pd

def main(symbol):
    print(f"Fetching 5 years data for {symbol}...")
    
    df = yf.download(symbol, period="5y", interval="1d", progress=False)
    
    if df.empty:
        print(f"No data for {symbol}")
        return
    
    df.columns = df.columns.droplevel(1) 
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
    df.sort_index(inplace=True)
    
    df.to_csv(f'{symbol.lower()}_data.csv')
    print(f"Saved {len(df)} rows to {symbol.lower()}_data.csv")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol", default="AAPL", nargs="?")
    args = parser.parse_args()
    main(args.symbol)