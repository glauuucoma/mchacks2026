# build_features_regression_final.py
import argparse
import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings("ignore")

def rsi(series, window=14):
    delta = series.diff()
    gain = delta.clip(lower=0).rolling(window).mean()
    loss = -delta.clip(upper=0).rolling(window).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def main(symbol, output_dir):
    df = pd.read_csv(
        f"{output_dir}/{symbol}_data.csv",
        parse_dates=["Date"],
        index_col="Date"
    )

    df = df.astype(float)

    # -------- RETURNS --------
    df["ret_1d"] = df["Close"].pct_change()
    df["ret_5d"] = df["Close"].pct_change(5)

    # -------- TREND --------
    df["sma_10"] = df["Close"].rolling(10).mean()
    df["sma_20"] = df["Close"].rolling(20).mean()
    df["sma_50"] = df["Close"].rolling(50).mean()
    df["trend_50"] = df["Close"] / df["sma_50"]

    # -------- MOMENTUM --------
    df["RSI"] = rsi(df["Close"])

    # MACD
    ema12 = df["Close"].ewm(span=12).mean()
    ema26 = df["Close"].ewm(span=26).mean()
    df["MACD"] = ema12 - ema26

    # -------- VOLATILITY (ATR) --------
    tr = pd.concat([
        df["High"] - df["Low"],
        (df["High"] - df["Close"].shift()).abs(),
        (df["Low"] - df["Close"].shift()).abs()
    ], axis=1).max(axis=1)

    df["ATR"] = tr.rolling(14).mean()
    df["ATR_pct"] = df["ATR"] / df["Close"]

    # -------- VOLUME --------
    df["vol_chg"] = df["Volume"].pct_change()
    df["vol_norm"] = df["Volume"] / df["Volume"].rolling(20).mean()

    # -------- TARGET (REGRESSION) --------
    # Log return for next 5 days
    df["target"] = np.log(df["Close"].shift(-5) / df["Close"])

    # -------- DROP ROWS ONLY IF FEATURES ARE NaN --------
    feature_cols = [
        "ret_1d", "ret_5d", "sma_10", "sma_20", "sma_50", "trend_50",
        "RSI", "MACD", "ATR", "ATR_pct", "vol_chg", "vol_norm"
    ]
    df.dropna(subset=feature_cols, inplace=True)

    # Now the last 5 rows are kept (target NaN) for testing/demo
    df.to_csv(f"{output_dir}/{symbol}_features_reg.csv")
    print(f"[OK] Regression features saved: {output_dir}/{symbol}_features_reg.csv")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol")
    parser.add_argument("output_dir", nargs="?", default=".")
    args = parser.parse_args()
    main(args.symbol, args.output_dir)
