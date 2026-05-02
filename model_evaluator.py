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
        y_true: 1D Array of true labels.
        y_pred: 1D Array of predicted labels.

    Returns:
        Dictionary containing accuracy, precision, recall, and F1 score.

    Raises:
        ValueError: If input arrays are empty or have different lengths.
    """
    if len(y_true) == 0 or len(y_pred) == 0:
        raise ValueError("Input arrays cannot be empty.")
    if len(y_true) != len(y_pred):
        raise ValueError("Input arrays must have the same length.")

    accuracy = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average='macro'
    )

    # Generate confusion matrix plot
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.savefig('confusion_matrix.png')
    plt.close()

    return {
        'accuracy': round(accuracy, 4),
        'precision': round(precision, 4),
        'recall': round(recall, 4),
        'f1_score': round(f1, 4)
    }