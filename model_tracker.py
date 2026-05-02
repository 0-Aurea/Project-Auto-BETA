import os
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass
class ModelMetrics:
    """Container for tracking model performance metrics.
    
    Attributes:
        accuracy: Model accuracy score (0-1 range)
        precision: Model precision score (0-1 range)
        recall: Model recall score (0-1 range)
        timestamp: UTC timestamp (in seconds since epoch) when metrics were recorded
    """
    accuracy: float
    precision: float
    recall: float
    timestamp: float = field(default_factory=time.time)