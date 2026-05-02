import logging
from AI.data_preprocessor import DataPreprocessor
from AI.evaluator import Evaluator
from AI.hyperparameter_tuner import HyperparameterTuner
from AI.inference_engine import InferenceEngine
import torch

class Brain:
    """
    Central class managing data preprocessing, model tuning, evaluation, and inference.

    Attributes:
        data_path (str): Path to input data.
        model_path (str): Path to model file (optional).
        preprocessor (DataPreprocessor): Handles data preprocessing.
        evaluator (Evaluator): Handles model evaluation.
        hyperparameter_tuner (HyperparameterTuner): Handles hyperparameter tuning.
        inference_engine (InferenceEngine): Handles model inference.
    """

    def __init__(self, data_path: str, model_path: str = None):
        """
        Initializes the Brain class.

        Args:
            data_path (str): Path to input data.
            model_path (str, optional): Path to model file. Defaults to None.
        """
        self.data_path = data_path
        self.model_path = model_path
        self.preprocessor = DataPreprocessor(data_path)
        self.evaluator = Evaluator()
        self.hyperparameter_tuner = HyperparameterTuner()
        self.inference_engine = InferenceEngine(model_path)

    def preprocess_data(self) -> None:
        """
        Preprocesses the data.

        Returns:
            None
        """
        self.preprocessor.preprocess()

    def tune_hyperparameters(self) -> None:
        """
        Tunes the hyperparameters.

        Returns:
            None
        """
        self.hyperparameter_tuner.tune()

    def evaluate_model(self) -> None:
        """
        Evaluates the model.

        Returns:
            None
        """
        self.evaluator.evaluate()

    def make_inference(self) -> None:
        """
        Makes inference using the model.

        Returns:
            None
        """
        self.inference_engine.infer()

    def run(self) -> None:
        """
        Runs the entire workflow.

        Returns:
            None
        """
        try:
            self.preprocess_data()
            self.tune_hyperparameters()
            self.evaluate_model()
            self.make_inference()
        except Exception as e:
            logging.error(f"An error occurred: {e}")