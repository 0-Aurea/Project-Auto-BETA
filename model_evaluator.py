import os
import json
import time
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
    """
    Calculate evaluation metrics between true and predicted labels.

    Args:
        y_true: 1D array of true labels.
        y_pred: 1D array of predicted labels.

    Returns:
        Dictionary containing accuracy, precision, recall, F1 score, and confusion matrix.
    """
    accuracy = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="macro")
    conf_matrix = confusion_matrix(y_true, y_pred)
    
    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "confusion_matrix": conf_matrix
    }

def plot_confusion_matrix(
    y_true: np.ndarray, 
    y_pred: np.ndarray, 
    classes: List[str], 
    output_path: str
) -> None:
    """
    Generate and save a confusion matrix visualization.

    Args:
        y_true: True labels.
        y_pred: Predicted labels.
        classes: List of class names for labeling.
        output_path: File path to save the plot.
    """
    matrix = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(matrix, annot=True, fmt="d", cmap="Blues", xticklabels=classes, yticklabels=classes)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()

def evaluate_model(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: Optional[List[str]] = None,
    output_dir: str = "evaluation_results"
) -> Dict[str, Any]:
    """
    Full model evaluation pipeline generating metrics and visualization.

    Args:
        y_true: True labels.
        y_pred: Predicted labels.
        class_names: Optional list of class names for visualization.
        output_dir: Directory to save evaluation outputs.

    Returns:
        Dictionary containing all calculated metrics.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    metrics = calculate_metrics(y_true, y_pred)
    
    if class_names:
        plot_confusion_matrix(
            y_true, 
            y_pred, 
            class_names, 
            os.path.join(output_dir, "confusion_matrix.png")
        )
    
    metrics["confusion_matrix_path"] = os.path.join(output_dir, "confusion_matrix.png")
    
    return metrics