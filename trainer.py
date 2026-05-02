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
        return np.mean(np.square(self.targets - outputs))

    def evolve(self, new_input_size, new_hidden_size, new_output_size):
        new_neural_network = NeuralNetwork(new_input_size, new_hidden_size, new_output_size)
        new_neural_network.weights1 = self.neural_network.weights1
        new_neural_network.weights2 = self.neural_network.weights2
        new_neural_network.bias1 = self.neural_network.bias1
        new_neural_network.bias2 = self.neural_network.bias2
        return new_neural_network
```