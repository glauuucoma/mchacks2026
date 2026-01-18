from pydantic import BaseModel
from typing import Optional

class ScanRequest(BaseModel):
    ticker: str

class GumloopResult(BaseModel):
    scan_id: str
    ticker: str

    # OPTIONAL — safe defaults for testing
    news_summary: Optional[str] = "Not available"
    reddit_sentiment: Optional[str] = "Neutral"
    trader_signal: Optional[str] = "None"
