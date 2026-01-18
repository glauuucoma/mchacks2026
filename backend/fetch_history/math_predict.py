import os
import argparse
import pandas as pd

# ---------- CONFIGURABLE THRESHOLDS ----------
RET_1D_BUY = 0.01       # 1% gain in 1 day → bullish
RET_1D_SELL = -0.01     # 1% loss in 1 day → bearish
RSI_OVERBOUGHT = 80     # RSI above this → overbought → SELL
RSI_OVERSOLD = 30       # RSI below this → oversold → BUY
TREND_50_BUY = 1.02     # Price > 2% above 50-day SMA → bullish
TREND_50_SELL = 0.98    # Price < 2% below 50-day SMA → bearish
MACD_BUY = 0             # MACD positive → upward momentum
MACD_SELL = 0            # MACD negative → downward momentum

# ---------- HEURISTIC FUNCTION ----------
def simple_decision(row):
    """Return BUY/SELL/HOLD based on thresholds."""
    if row["ret_1d"] > RET_1D_BUY and row["RSI"] < RSI_OVERBOUGHT and row["trend_50"] > TREND_50_BUY and row["MACD"] > MACD_BUY:
        return "BUY"
    elif row["ret_1d"] < RET_1D_SELL or row["RSI"] > RSI_OVERBOUGHT or row["trend_50"] < TREND_50_SELL or row["MACD"] < MACD_SELL:
        return "SELL"
    else:
        return "HOLD"

# ---------- MAIN ----------
def predict_last_date(symbol):
    stock_dir = os.path.join("stocks_data", symbol.upper())
    features_file = os.path.join(stock_dir, f"{symbol.upper()}_features_reg.csv")

    if not os.path.exists(features_file):
        print(f"❌ Features file not found: {features_file}")
        return

    # Load CSV
    df = pd.read_csv(features_file, parse_dates=["Date"], index_col="Date")

    # Take last row
    last_row = df.iloc[-1]

    # Make decision
    decision = simple_decision(last_row)
    return decision

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol", help="Stock symbol (e.g., GOOG, AAPL)")
    args = parser.parse_args()

    decision = predict_last_date(args.symbol)
    if decision:
        print(decision)  # BUY / SELL / HOLD
