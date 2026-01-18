import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fetch_history.history_pipeline import predict_today  # your function

app = FastAPI()

# Allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set your consistent stock directory here
STOCK_DIR = os.path.join(os.path.dirname(__file__), "fetch_history", "stocks_data")

@app.get("/recommendation")
def get_recommendation(symbol: str = Query(..., description="Stock symbol to predict")):
    """
    Returns recommendation for a given symbol.
    Dynamically constructs the model, scaler, and features file paths.
    """
    try:
        # Construct paths based on the symbol
        model_path = os.path.join(STOCK_DIR, symbol, f"{symbol}_reg_model.pth")
        scaler_path = os.path.join(STOCK_DIR, symbol, f"{symbol}_scaler.save")
        features_file = os.path.join(STOCK_DIR, symbol, f"{symbol}_features_reg.csv")
        result = predict_today(symbol, os.path.join(STOCK_DIR, symbol))

        return {"recommendation": result}

    except Exception as e:
        return {"error": str(e)}
