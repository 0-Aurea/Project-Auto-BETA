CONTENT:
```python
import numpy as np
from neural_net import NeuralNetwork

class Trainer:
    def __init__(self, neural_network, inputs, targets):
        self.neural_network = neural_network
        self.inputs = inputs
        self.targets = targets

    def train(self, learning_rate, epochs):
        for _ in range(epochs):
            self.neural_network.train(self.inputs, self.targets, learning_rate)

    def evaluate(self):
        _, outputs = self.neural_network.forward(self.inputs)
        predicted = np.round(outputs)
        accuracy = np.mean(predicted == self.targets)
        return accuracy
```