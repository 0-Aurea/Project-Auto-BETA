import os
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ModelMetrics:
    """Container for tracking model performance metrics.
    
    Attributes:
        accuracy: Model accuracy score (0-1 range)
        precision: Model precision score (0-1 range)
        recall: Model recall score (0-1 range)
        timestamp: UTC timestamp of metric recording
    """
    accuracy: float
    precision: float
    recall: float
    timestamp: Optional[float] = None

    def __post_init__(self):
        """Initialize timestamp if not provided."""
        if self.timestamp is None:
            self.timestamp = time.time()


class ModelTracker:
    """Tracks machine learning model versions and their performance metrics.
    
    Manages model versioning by storing metrics and providing methods to
    retrieve the best performing models based on specified criteria.
    """
    
    def __init__(self, storage_path: str = "model_data"):
        """
        Initialize model tracker with storage directory.
        
        Creates storage directory if it doesn't exist. Uses a counter
        to track model versions sequentially.
        
        Args:
            storage_path: Directory path for model storage (default: "model_data")
        """
        self.storage_path = storage_path
        os.makedirs(self.storage_path, exist_ok=True)
        self._model_versions: List[Dict[str, Any]] = []
        self._version_counter = 0

    def log_model(self, model_path: str, metrics: ModelMetrics) -> int:
        """
        Register a new model with its performance metrics.
        
        Args:
            model_path: Filesystem path where model is stored
            metrics: ModelMetrics instance containing evaluation results
            
        Returns:
            Version number assigned to this model
        """
        self._version_counter += 1
        self._model_versions.append({
            'version': self._version_counter,
            'model_path': os.path.abspath(model_path),
            'metrics': metrics
        })
        return self._version_counter

    def get_best_model(self, metric: str = 'accuracy') -> Optional[Dict[str, Any]]:
        """
        Retrieve the model with the highest value for the specified metric.
        
        Args:
            metric: Metric to optimize ('accuracy', 'precision', or 'recall')
            
        Returns:
            Dictionary containing model version, path, and metrics or None
            if no models are registered
        """
        if not self._model_versions:
            return None
            
        try:
            return max(self._model_versions, 
                      key=lambda x: getattr(x['metrics'], metric))
        except ValueError as e:
            raise ValueError(f"No models registered: {e}")

    def list_models(self) -> List[Dict[str, Any]]:
        """
        Get a copy of all tracked model records.
        
        Returns:
            List of dictionaries containing model version, path, and metrics
        """
        return self._model_versions.copy()

    def get_model_by_version(self, version: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific model by version number.
        
        Args:
            version: Model version number to retrieve
            
        Returns:
            Dictionary containing model information or None if not found
        """
        for model in self._model_versions:
            if model['version'] == version:
                return model
        return None