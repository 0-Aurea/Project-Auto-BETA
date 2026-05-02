# Standard library imports
import os
import sys
import time
from typing import List, Dict, Any, Optional

# Third-party imports
import numpy as np
import pandas as pd

# Local application imports
from ai_brain import Brain
from data_loader import DataLoader


def load_training_data(data_path: str) -> List[Dict[str, Any]]:
    """Load and preprocess training data from specified path.
    
    Args:
        data_path: Path to training data file/folder
        
    Returns:
        List of preprocessed training samples
    """
    try:
        loader = DataLoader(data_path)
        raw_data = loader.load()
        return [preprocess_sample(sample) for sample in raw_data]
    except Exception as e:
        print(f"Error loading training data: {str(e)}")
        sys.exit(1)


def preprocess_sample(sample: Dict[str, Any]) -> Dict[str, Any]:
    """Standardize and clean individual training sample.
    
    Args:
        sample: Raw input data sample
        
    Returns:
        Processed and validated data sample
    """
    processed = {
        'input': np.array(sample['features']).astype(np.float32),
        'target': sample['label'],
        'metadata': {
            'timestamp': time.time(),
            'source': sample.get('source', 'unknown')
        }
    }
    
    # Add validation checks
    if not validate_sample(processed):
        raise ValueError(f"Invalid sample: {sample}")
    
    return processed


def validate_sample(sample: Dict[str, Any]) -> bool:
    """Validate processed sample meets training requirements.
    
    Args:
        sample: Processed data sample to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not isinstance(sample['input'], np.ndarray):
        return False
    if not isinstance(sample['target'], (int, float, np.number)):
        return False
    return True


def train_model(brain: Brain, 
                training_data: List[Dict[str, Any]],
                epochs: int = 100,
                batch_size: int = 32) -> None:
    """Train neural network model with provided data.
    
    Args:
        brain: Brain instance containing neural network
        training_data: List of processed training samples
        epochs: Number of training iterations
        batch_size: Size of training batches
    """
    try:
        brain.compile_model()
        brain.train(
            data=training_data,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2
        )
        brain.save_model("trained_model.pth")
    except Exception as e:
        print(f"Training failed: {str(e)}")
        sys.exit(1)


def main():
    """Main training pipeline execution."""
    # Configuration parameters
    DATA_PATH = os.getenv("TRAINING_DATA_PATH", "data/training")
    EPOCHS = int(os.getenv("TRAINING_EPOCHS", 100))
    BATCH_SIZE = int(os.getenv("TRAINING_BATCH_SIZE", 32))
    
    # Initialize components
    try:
        training_data = load_training_data(DATA_PATH)
        brain = Brain(input_size=128, hidden_size=256, output_size=10)
        
        # Execute training
        train_model(brain, training_data, EPOCHS, BATCH_SIZE)
        
    except Exception as e:
        print(f"Training pipeline failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()