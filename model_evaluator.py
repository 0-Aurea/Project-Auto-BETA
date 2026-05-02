import os
import json
import time
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Calculate evaluation metrics between true and predicted labels.
    
    Args:
        y_true: Array of true labels.
        y_pred: Array of predicted labels.
        
    Returns:
        Dictionary containing accuracy, precision, recall, and F1 score.
    """
    accuracy = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted')
    return {
        'accuracy': float(round(accuracy, 4)),
        'precision': float(round(precision, 4)),
        'recall': float(round(recall, 4)),
        'f1_score': float(round(f1, 4))
    }

def plot_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, output_path: str) -> None:
    """
    Generate and save a confusion matrix plot.
    
    Args:
        y_true: True labels.
        y_pred: Predicted labels.
        output_path: File path to save the plot.
    """
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix')
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()

def evaluate_model(model: Any, X_test: np.ndarray, y_test: np.ndarray, output_dir: str) -> Dict[str, Any]:
    """
    Evaluate a trained model on test data and save results.
    
    Args:
        model: Trained machine learning model.
        X_test: Test features.
        y_test: True test labels.
        output_dir: Directory to save evaluation files.
        
    Returns:
        Dictionary of evaluation metrics and file paths.
    """
    start_time = time.time()
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    metrics = calculate_metrics(y_test, y_pred)
    metrics['inference_time'] = round(time.time() - start_time, 4)
    
    # Save metrics
    metrics_path = os.path.join(output_dir, 'model_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=4)
    
    # Generate and save confusion matrix
    cm_path = os.path.join(output_dir, 'confusion_matrix.png')
    plot_confusion_matrix(y_test, y_pred, cm_path)
    
    return {
        'metrics': metrics,
        'metrics_file': metrics_path,
        'confusion_matrix': cm_path
    }

if __name__ == '__main__':
    # Example usage for testing
    from sklearn.linear_model import LogisticRegression
    from sklearn.datasets import make_classification
    
    X, y = make_classification(n_samples=1000, n_features=20, random_state=42)
    X_train, X_test = X[:800], X[800:]
    y_train, y_test = y[:800], y[800:]
    
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)
    
    results = evaluate_model(model, X_test, y_test, output_dir='./evaluation_results')
    print("Evaluation completed. Metrics saved to:", results['metrics_file'])