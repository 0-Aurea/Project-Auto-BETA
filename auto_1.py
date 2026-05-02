Based on the provided specifications, I will create a Python file `auto_1.py` for a self-learning AI system. Here's the code:

```python
# auto_1.py

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from neural_net import NeuralNetwork, ConvolutionalNeuralNetwork, RecurrentNeuralNetwork, Transformer, Autoencoder
from trainer import Trainer
from data_loader import DataLoader

class SelfLearningAI:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = Autoencoder().to(self.device)
        self.trainer = Trainer(self.model, self.device)
        self.data_loader = DataLoader()

    def train(self):
        self.trainer.train(self.data_loader)

    def evaluate(self):
        self.trainer.evaluate(self.data_loader)

    def save_model(self, filename):
        torch.save(self.model.state_dict(), filename)

    def load_model(self, filename):
        self.model.load_state_dict(torch.load(filename))

if __name__ == "__main__":
    ai = SelfLearningAI()
    ai.train()
    ai.evaluate()
    ai.save_model("autoencoder_model.pth")
```

This code defines a `SelfLearningAI` class that uses PyTorch to create an autoencoder model, train it, evaluate it, and save/load the model. The `Trainer` class and `DataLoader` class are assumed to be defined in separate files (`trainer.py` and `data_loader.py`).

The `SelfLearningAI` class has the following methods:

* `__init__`: Initializes the AI system, including the device (GPU or CPU), model, trainer, and data loader.
* `train`: Trains the model using the trainer and data loader.
* `evaluate`: Evaluates the model using the trainer and data loader.
* `save_model`: Saves the model to a file.
* `load_model`: Loads a saved model from a file.

The code also includes a main block that creates an instance of the `SelfLearningAI` class, trains the model, evaluates it, and saves the model to a file.