# train_model_final_with_accuracy.py
import argparse
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from torch.utils.data import DataLoader, TensorDataset

SEQ_LEN = 60
THRESH_MULT = 0.5

FEATURES = [
    "Close", "Volume", "RSI", "MACD", "ATR_pct",
    "ret_1d", "ret_5d", "trend_50", "vol_norm"
]

class GRURegressor(nn.Module):
    def __init__(self, input_size):
        super().__init__()
        self.gru = nn.GRU(input_size, 64, num_layers=2, batch_first=True)
        self.fc = nn.Linear(64, 1)

    def forward(self, x):
        out, _ = self.gru(x)
        return self.fc(out[:, -1]).squeeze(1)

def make_sequences(X, y):
    xs, ys = [], []
    for i in range(SEQ_LEN, len(X)):
        xs.append(X[i-SEQ_LEN:i])
        ys.append(y[i])
    return np.array(xs), np.array(ys)

def get_signal(pred, atr):
    if pred > THRESH_MULT * atr:
        return "BUY"
    elif pred < -THRESH_MULT * atr:
        return "SELL"
    else:
        return "HOLD"

def predict_for_date(df, scaler, model, date, device):
    """Predict 5-day return for any historical date"""
    if date not in df.index:
        print(f"❌ Date {date.date()} not in dataset")
        return
    pos = df.index.get_loc(date)
    if pos < SEQ_LEN:
        print(f"❌ Not enough history to predict for {date.date()}")
        return
    seq = scaler.transform(df[FEATURES].iloc[pos-SEQ_LEN+1:pos+1])
    seq_tensor = torch.tensor(seq, dtype=torch.float32).unsqueeze(0).to(device)
    with torch.no_grad():
        pred = model(seq_tensor).item()
    atr = df["ATR_pct"].iloc[pos]
    decision = get_signal(pred, atr)
    print(f"{date.date()} | Predicted 5d return: {pred:.4%} | ATR threshold: {THRESH_MULT*atr:.4%} | Decision: {decision}")

def train(symbol, output_dir):
    df = pd.read_csv(
        f"{output_dir}/{symbol}_features_reg.csv",
        parse_dates=["Date"],
        index_col="Date"
    )

    # Split for training/testing
    split = int(len(df) * 0.8)
    train_df = df.iloc[:split]
    test_df = df.iloc[split:]

    # Scale features
    scaler = MinMaxScaler()
    scaler.fit(train_df[FEATURES])

    X_train = scaler.transform(train_df[FEATURES])
    X_test = scaler.transform(test_df[FEATURES])

    y_train = train_df["target"].values
    y_test = test_df["target"].values

    X_train, y_train = make_sequences(X_train, y_train)
    X_test, y_test = make_sequences(X_test, y_test)

    train_ds = TensorDataset(
        torch.tensor(X_train, dtype=torch.float32),
        torch.tensor(y_train, dtype=torch.float32)
    )

    loader = DataLoader(train_ds, batch_size=32, shuffle=False)

    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = GRURegressor(len(FEATURES)).to(device)

    # Loss & optimizer
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    # ---------- TRAINING ----------
    for epoch in range(40):
        model.train()
        losses = []
        for xb, yb in loader:
            xb, yb = xb.to(device), yb.to(device)
            optimizer.zero_grad()
            preds = model(xb)
            loss = criterion(preds, yb)
            loss.backward()
            optimizer.step()
            losses.append(loss.item())
        if epoch % 10 == 0:
            print(f"Epoch {epoch} | MSE {np.mean(losses):.6f}")

    # ---------- WALK-FORWARD BACKTEST ----------
    model.eval()
    equity = 1.0
    trades = 0
    correct_signals = 0
    total_signals = 0

    print("\n📊 WALK-FORWARD BACKTEST")
    print("Date       | Pred 5d Return | ATR Thresh | Decision | Actual Signal")

    for i in range(len(X_test)):
        if i + SEQ_LEN >= len(test_df):
            break  # prevent index error

        seq = torch.tensor(X_test[i:i+1], dtype=torch.float32).to(device)
        pred = model(seq).item()
        atr = test_df["ATR_pct"].iloc[i + SEQ_LEN]

        # Get model signal
        signal = get_signal(pred, atr)
        y_actual = y_test[i]
        actual_signal = get_signal(y_actual, atr)

        # Skip if model predicted HOLD
        if signal == "HOLD":
            continue

        # Track equity for BUY/SELL predictions
        if signal == "BUY":
            equity *= np.exp(y_actual)
            trades += 1
        elif signal == "SELL":
            equity *= np.exp(-y_actual)
            trades += 1

        # Track directional accuracy (only BUY/SELL predictions)
        total_signals += 1
        if signal == actual_signal:
            correct_signals += 1

        # Print each prediction
        date_str = test_df.index[i + SEQ_LEN].strftime("%Y-%m-%d")
        print(f"{date_str} | {pred:.4%}       | {THRESH_MULT*atr:.4%}  | {signal}    | {actual_signal}")

    directional_accuracy = correct_signals / total_signals if total_signals > 0 else np.nan

    print(f"\n📈 Backtest equity: {equity:.2f}")
    print(f"🔁 Trades taken: {trades}")
    print(f"✅ Directional accuracy: {directional_accuracy:.2%}")

    # ---------- TODAY PREDICTION ----------
    last_seq = scaler.transform(df[FEATURES].iloc[-SEQ_LEN:])
    last_seq_tensor = torch.tensor(last_seq, dtype=torch.float32).unsqueeze(0).to(device)
    with torch.no_grad():
        pred_today = model(last_seq_tensor).item()
    atr_today = df["ATR_pct"].iloc[-1]

    decision_today = get_signal(pred_today, atr_today)

    print("\n📅 TODAY")
    print(f"Predicted 5d return: {pred_today:.4%}")
    print(f"ATR threshold: {THRESH_MULT * atr_today:.4%}")
    print(f"🎯 DECISION: {decision_today}")

    # ---------- SAVE MODEL ----------
    torch.save({
        "model": model.state_dict(),
        "scaler": scaler,
        "features": FEATURES,
        "seq_len": SEQ_LEN
    }, f"{output_dir}/{symbol}_reg_model.pth")
    print("✅ Model saved")

    # ---------- DEMO: PREDICT HISTORICAL DATE ----------
    demo_date = df.index[-6]  # 5 days before last date
    print("\n📅 DEMO HISTORICAL PREDICTION")
    predict_for_date(df, scaler, model, demo_date, device)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol")
    parser.add_argument("output_dir", nargs="?", default=".")
    args = parser.parse_args()
    train(args.symbol, args.output_dir)
