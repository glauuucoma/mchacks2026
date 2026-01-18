import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import importlib.util
from fetch_history.history_pipeline import predict_today  # ML model

# Initialize FastAPI app and middleware at the top
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


# Math-based recommendation endpoint
@app.get("/math_recommendation")
def get_math_recommendation(symbol: str = Query(..., description="Stock symbol to predict")):
    """
    Returns math-based recommendation for a given symbol.
    Dynamically constructs the features file path and uses math_predict.
    """
    try:
        # Always use uppercase for symbol
        symbol = symbol.upper()
        stock_dir = os.path.join(STOCK_DIR, symbol)
        features_file = os.path.join(stock_dir, f"{symbol}_features_reg.csv")

        # Dynamically import math_predict
        math_predict_path = os.path.join(os.path.dirname(__file__), "fetch_history", "math_predict.py")
        spec = importlib.util.spec_from_file_location("math_predict", math_predict_path)
        math_predict = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(math_predict)
        result = math_predict.predict_last_date(symbol)
        return {"recommendation": result}
    except Exception as e:
        return {"error": str(e)}



@app.get("/GRURegressor")
def get_recommendation(symbol: str = Query(..., description="Stock symbol to predict")):
    """
    Returns recommendation for a given symbol.
    Dynamically constructs the model, scaler, and features file paths.
    """
    try:
        # Always use uppercase for symbol
        symbol = symbol.upper()
        stock_dir = os.path.join(STOCK_DIR, symbol)
        
        # Construct paths based on the symbol
        model_path = os.path.join(stock_dir, f"{symbol}_reg_model.pth")
        scaler_path = os.path.join(stock_dir, f"{symbol}_scaler.save")
        features_file = os.path.join(stock_dir, f"{symbol}_features_reg.csv")
        
        result = predict_today(symbol, stock_dir)
        return {"recommendation": result}

    except Exception as e:
        return {"error": str(e)}
