import logging
from AI.data_preprocessor import DataPreprocessor
from AI.evaluator import Evaluator
from AI.hyperparameter_tuner import HyperparameterTuner
from AI.inference_engine import InferenceEngine
import torch

class Brain:
    def __init__(self, data_path, model_path=None):
        self.data_path = data_path
        self.model_path = model_path
        self.preprocessor = DataPreprocessor()
        self.tuner = HyperparameterTuner()
        self.evaluator = Evaluator()
        self.inference_engine = InferenceEngine(model_path)

    def preprocess_data(self):
        self.X_train, self.X_test, self.y_train, self.y_test = self.preprocessor.load_and_preprocess(self.data_path)

    def tune_hyperparameters(self):
        self.best_model = self.tuner.tune(self.X_train, self.y_train)

    def train_model(self):
        self.best_model.fit(self.X_train, self.y_train)

    def evaluate_model(self):
        score = self.evaluator.evaluate(self.best_model, self.X_test, self.y_test)
        logging.info(f"Model evaluation score: {score}")

    def save_model(self):
        torch.save(self.best_model.state_dict(), self.model_path)
        self.inference_engine = InferenceEngine(self.model_path)

    def run(self):
        self.preprocess_data()
        self.tune_hyperparameters()
        self.train_model()
        self.evaluate_model()
        self.save_model()

if __name__ == "__main__":
    brain = Brain(data_path="data.csv", model_path="model.pth")
    brain.run()