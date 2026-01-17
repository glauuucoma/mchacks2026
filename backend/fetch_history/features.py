import argparse, pandas as pd, numpy as np, warnings
import pandas_ta as ta
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
    
    # Features
    df['Returns'] = df['Close'].pct_change()
    df['RSI'] = compute_rsi(df['Close'])
    
    # MACD
    ema12 = df['Close'].ewm(span=12).mean()
    ema26 = df['Close'].ewm(span=26).mean()
    df['MACD'] = ema12 - ema26
    
    # ATR
    tr1 = df['High'] - df['Low']
    tr2 = abs(df['High'] - df['Close'].shift())
    tr3 = abs(df['Low'] - df['Close'].shift())
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    df['ATR'] = tr.rolling(14).mean()
    
    # Target (thresholded returns)
    df['Target'] = np.where(df['Returns'].shift(-1) > 0.01, 2,    # BUY >1%
                           np.where(df['Returns'].shift(-1) < -0.01, 0, 1))  # SELL <-1%
    
    df.dropna(inplace=True)
    df.to_csv(f'{symbol.lower()}_features.csv')

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol", nargs="?")
    args = parser.parse_args()
    if args.symbol:
        main(args.symbol)
