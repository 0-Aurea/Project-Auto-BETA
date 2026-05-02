import logging
from AI.data_preprocessor import DataPreprocessor
from AI.evaluator import Evaluator
from AI.hyperparameter_tuner import HyperparameterTuner
from AI.inference_engine import InferenceEngine
import torch


class Brain:
    """Central class managing data preprocessing, model tuning, evaluation, and inference.

    Attributes:
        data_path (str): Path to input data.
        model_path (str): Path to model file (optional).
        preprocessor (DataPreprocessor): Handles data preprocessing.
        tuner (HyperparameterTuner): Manages hyperparameter tuning.
        evaluator (Evaluator): Evaluates model performance.
        inference_engine (InferenceEngine): Handles model inference.
    """

    def __init__(self, data_path, model_path=None):
        """Initializes the Brain with data and model paths.

        Args:
            data_path (str): Path to the dataset.
            model_path (str, optional): Path to pre-trained model. Defaults to None.
        """
        self.data_path = data_path
        self.model_path = model_path
        self.preprocessor = DataPreprocessor()
        self.tuner = HyperparameterTuner()
        self.evaluator = Evaluator()
        self.inference_engine = InferenceEngine(model_path=model_path)