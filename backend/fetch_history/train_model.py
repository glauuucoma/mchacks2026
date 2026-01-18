# train_regression_model.py
import argparse
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from torch.utils.data import DataLoader, TensorDataset

SEQ_LEN = 60
THRESH_MULT = 0.5  # ATR multiplier

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

def train(symbol, output_dir):
    df = pd.read_csv(
        f"{output_dir}/{symbol}_features_reg.csv",
        parse_dates=["Date"],
        index_col="Date"
    )

    split = int(len(df) * 0.8)
    train_df = df.iloc[:split]
    test_df = df.iloc[split:]

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

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = GRURegressor(len(FEATURES)).to(device)

    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

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

    for i in range(len(X_test)):
        seq = torch.tensor(X_test[i:i+1], dtype=torch.float32).to(device)
        pred = model(seq).item()
        atr = test_df["ATR_pct"].iloc[i + SEQ_LEN]

        if pred > THRESH_MULT * atr:
            equity *= np.exp(y_test[i])
            trades += 1
        elif pred < -THRESH_MULT * atr:
            equity *= np.exp(-y_test[i])
            trades += 1

    print(f"\n📈 Backtest equity: {equity:.2f}")
    print(f"🔁 Trades taken: {trades}")

    # ---------- TODAY PREDICTION ----------
    last_seq = scaler.transform(df[FEATURES].iloc[-SEQ_LEN:])
    last_seq = torch.tensor(last_seq, dtype=torch.float32).unsqueeze(0).to(device)

    with torch.no_grad():
        pred = model(last_seq).item()

    atr_today = df["ATR_pct"].iloc[-1]

    if pred > THRESH_MULT * atr_today:
        decision = "BUY"
    elif pred < -THRESH_MULT * atr_today:
        decision = "SELL"
    else:
        decision = "HOLD"

    print("\n📅 TODAY")
    print(f"Predicted 5d return: {pred:.4%}")
    print(f"ATR threshold: {THRESH_MULT * atr_today:.4%}")
    print(f"🎯 DECISION: {decision}")

    torch.save({
        "model": model.state_dict(),
        "scaler": scaler,
        "features": FEATURES,
        "seq_len": SEQ_LEN
    }, f"{output_dir}/{symbol}_reg_model.pth")

    print("✅ Model saved")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol")
    parser.add_argument("output_dir", nargs="?", default=".")
    args = parser.parse_args()
    train(args.symbol, args.output_dir)
