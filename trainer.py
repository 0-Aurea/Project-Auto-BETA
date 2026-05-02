CONTENT:
```python
import numpy as np
from neural_net import NeuralNetwork, ConvolutionalNeuralNetwork, RecurrentNeuralNetwork

class Trainer:
    def __init__(self, model, inputs, targets):
        self.model = model
        self.inputs = inputs
        self.targets = targets

    def train(self, learning_rate, epochs):
        for _ in range(epochs):
            if isinstance(self.model, NeuralNetwork):
                self.model.train(self.inputs, self.targets, learning_rate)
            elif isinstance(self.model, ConvolutionalNeuralNetwork):
                self.model.forward(self.inputs)
            elif isinstance(self.model, RecurrentNeuralNetwork):
                self.model.forward(self.inputs)
```