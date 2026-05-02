import os
import sys
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ModelMetrics:
    """Container for tracking model performance metrics."""
    accuracy: float
    precision: float
    recall: float
    timestamp: float = time.time()

class ModelTracker:
    """Tracks machine learning model versions and their performance metrics."""
    
    def __init__(self, storage_path: str = "model_data"):
        """
        Initialize model tracker with storage directory.
        
        Args:
            storage_path: Directory path for storing model metadata
        """
        self.storage_path = storage_path
        self._ensure_storage_directory()
        self.models: Dict[str, List[ModelMetrics]] = {}
    
    def _ensure_storage_directory(self) -> None:
        """Create storage directory if it doesn't exist."""
        os.makedirs(self.storage_path, exist_ok=True)
    
    def add_model(self, model_name: str, metrics: ModelMetrics) -> None:
        """
        Add new model metrics to tracking system.
        
        Args:
            model_name: Name/identifier of the model
            metrics: Performance metrics to track
        """
        if model_name not in self.models:
            self.models[model_name] = []
        self.models[model_name].append(metrics)
        self._persist_model_data(model_name)
    
    def _persist_model_data(self, model_name: str) -> None:
        """Save model metrics to disk in JSON format."""
        model_data = {
            "model_name": model_name,
            "metrics": [
                {
                    "accuracy": m.accuracy,
                    "precision": m.precision,
                    "recall": m.recall,
                    "timestamp": m.timestamp
                } for m in self.models[model_name]
            ]
        }
        
        file_path = os.path.join(self.storage_path, f"{model_name}.json")
        with open(file_path, 'w') as f:
            json.dump(model_data, f, indent=2)
    
    def get_best_model(self, metric: str = "accuracy") -> Optional[str]:
        """
        Retrieve model with best performance based on specified metric.
        
        Args:
            metric: Metric to evaluate (accuracy, precision, or recall)
            
        Returns:
            Name of the best performing model or None if no models exist
        """
        best_model = None
        best_value = -1.0
        
        for model_name, metrics in self.models.items():
            if not metrics:
                continue
                
            latest_metrics = metrics[-1]
            current_value = getattr(latest_metrics, metric, -1.0)
            
            if current_value > best_value:
                best_value = current_value
                best_model = model_name
                
        return best_model
    
    def clear_all(self) -> None:
        """Remove all tracked models and their metrics."""
        self.models.clear()
        for file_name in os.listdir(self.storage_path):
            file_path = os.path.join(self.storage_path, file_name)
            if os.path.isfile(file_path):
                os.remove(file_path)