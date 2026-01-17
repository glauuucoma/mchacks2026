import argparse, pandas as pd, numpy as np, warnings
warnings.filterwarnings('ignore')  # Suppress warnings

def compute_rsi(prices, window=14):
    delta = prices.diff()
    gain = delta.where(delta > 0, 0).rolling(window=window).mean()
    loss = -delta.where(delta < 0, 0).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def main(symbol):
    csv_file = f'{symbol.lower()}_data.csv'
    df = pd.read_csv(f'{symbol.lower()}_data.csv', index_col=0, parse_dates=True)
    
    # Force numeric (handles strings/None)
    for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    df.dropna(subset=['Close'], inplace=True)  # Drop bad rows
    
    # Features (safe pct_change)
    df['Returns'] = df['Close'].pct_change(fill_method=None)
    df['SMA_20'] = df['Close'].rolling(20).mean()
    df['SMA_50'] = df['Close'].rolling(50).mean()
    df['RSI'] = compute_rsi(df['Close'])
    df['BB_upper'] = df['SMA_20'] + (df['Close'].rolling(20).std() * 2)
    df['BB_lower'] = df['SMA_20'] - (df['Close'].rolling(20).std() * 2)
    
    # Signals/Target
    df['Signal'] = np.where(df['RSI'] < 30, 'BUY', np.where(df['RSI'] > 70, 'SELL', 'HOLD'))
    df['Target'] = np.where(df['Close'].shift(-1) > df['Close'], 1, 0)
    
    df.dropna(inplace=True)
    df.to_csv(f'{symbol.lower()}_features.csv')
    print(df[['Close', 'RSI', 'Signal']].tail())
    print("\nSignal counts:", df['Signal'].value_counts())

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol", nargs="?")
    args = parser.parse_args()
    if not args.symbol:
        print("Usage: python features.py GOOG")
    else:
        main(args.symbol)
