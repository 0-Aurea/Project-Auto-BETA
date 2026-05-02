import os
import sys
import time
import random
from typing import List, Dict, Any, Optional

def train_model(data: List[Dict[str, Any]], epochs: int = 10, batch_size: int = 32) -> Dict[str, Any]:
    """
    Train a model using the provided dataset with specified parameters.
    
    Args:
        data: List of dictionaries containing training data
        epochs: Number of training epochs (default: 10)
        batch_size: Size of training batches (default: 32)
        
    Returns:
        Dictionary containing model information including training time, loss history, and final metrics.
        
    Raises:
        ValueError: If data is empty or batch_size is non-positive
    """
    if not data:
        raise ValueError("Training data cannot be empty.")
    if batch_size <= 0:
        raise ValueError("Batch size must be a positive integer.")
    
    start_time = time.time()
    loss_history = []
    
    for epoch in range(epochs):
        random.shuffle(data)
        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            # Simulate batch processing (replace with actual training logic)
            loss = 1.0 / (epoch + 1 + (i / len(data)) + 1e-6)
            loss_history.append(loss)
        print(f"Epoch {epoch + 1}/{epochs} completed.")
    
    training_time = time.time() - start_time
    return {
        'training_time': training_time,
        'loss_history': loss_history,
        'final_loss': loss_history[-1] if loss_history else 0.0
    }