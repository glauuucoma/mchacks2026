import argparse, torch, torch.nn as nn, numpy as np, pandas as pd
from xml.parsers.expat import model
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score
import pandas_ta as ta

class StockLSTM(nn.Module):
    def __init__(self, input_size=5, hidden_size=50, num_layers=2):  # 10 features
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, 3)  # 3 classes: buy/sell/hold
        self.softmax = nn.Softmax(dim=1)
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        out = self.fc(lstm_out[:, -1, :])  # Last timestep
        return self.softmax(out)  # Probabilities

def prepare_data(df, seq_length=60):
    features = ['Close', 'Volume', 'RSI', 'MACD', 'ATR']
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(df[features].dropna())
    
    X, y = [], []
    for i in range(seq_length, len(scaled)):
        X.append(scaled[i-seq_length:i])
        # Label: 0=SELL (RSI>70), 1=HOLD (30-70), 2=BUY (RSI<30)
        rsi = df['RSI'].iloc[i]
        if rsi < 30: y.append(2)
        elif rsi > 70: y.append(0)
        else: y.append(1)
    
    return np.array(X), np.array(y), scaler, features

def train_model(symbol):
    df = pd.read_csv(f'{symbol.lower()}_features.csv', index_col=0, parse_dates=True)
    df.dropna(inplace=True)
    
    X, y, scaler, features = prepare_data(df)
    
    # Train/test split
    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    
    # PyTorch datasets
    train_ds = TensorDataset(torch.FloatTensor(X_train), torch.LongTensor(y_train))
    test_ds = TensorDataset(torch.FloatTensor(X_test), torch.LongTensor(y_test))
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    
    # Model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = StockLSTM().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    # Train
    model.train()
    for epoch in range(50):
        total_loss = 0
        for batch_X, batch_y in train_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        if epoch % 10 == 0:
            print(f'Epoch {epoch}, Loss: {total_loss/len(train_loader):.4f}')
    
    # Evaluate
    model.eval()
    with torch.no_grad():
        test_preds = model(torch.FloatTensor(X_test).to(device)).cpu().numpy().argmax(1)
    acc = accuracy_score(y_test, test_preds)
    print(f'Test Accuracy: {acc:.3f}')
    
    # Predict LAST date
    last_seq = torch.FloatTensor(X[-1:]).to(device)  # (1, seq_length, input_size)
    model.eval()
    with torch.no_grad():
        probs = model(last_seq).cpu().numpy()[0]  # probs[3] for classes

    decisions = ['SELL', 'HOLD', 'BUY']
    latest_rsi = df['RSI'].iloc[-1]
    print(f"\nLatest RSI: {latest_rsi:.1f}")
    for i, prob in enumerate(probs):
        print(f"  {decisions[i]}: {prob:.1%}")
    pred_class = np.argmax(probs)
    print(f"\n🎯 RECOMMENDATION: {decisions[pred_class]} ({probs[pred_class]:.1%})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("symbol", nargs="?")
    args = parser.parse_args()
    if args.symbol:
        train_model(args.symbol)
    else:
        print("Usage: python train_model.py GOOG")
