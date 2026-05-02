CONTENT:
```python
import numpy as np

class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size

        self.weights1 = np.random.rand(input_size, hidden_size)
        self.weights2 = np.random.rand(hidden_size, output_size)
        self.bias1 = np.zeros((1, hidden_size))
        self.bias2 = np.zeros((1, output_size))

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))

    def train(self, inputs, targets, learning_rate):
        # Forward pass
        hidden_layer = self.sigmoid(np.dot(inputs, self.weights1) + self.bias1)
        outputs = self.sigmoid(np.dot(hidden_layer, self.weights2) + self.bias2)

        # Backward pass
        output_errors = targets - outputs
        output_delta = output_errors * outputs * (1 - outputs)

        hidden_errors = output_delta.dot(self.weights2.T)
        hidden_delta = hidden_errors * hidden_layer * (1 - hidden_layer)

        # Weight updates
        self.weights2 += learning_rate * hidden_layer.T.dot(output_delta)
        self.bias2 += learning_rate * np.sum(output_delta, axis=0, keepdims=True)

        self.weights1 += learning_rate * inputs.T.dot(hidden_delta)
        self.bias1 += learning_rate * np.sum(hidden_delta, axis=0, keepdims=True)

    def forward(self, inputs):
        hidden_layer = self.sigmoid(np.dot(inputs, self.weights1) + self.bias1)
        outputs = self.sigmoid(np.dot(hidden_layer, self.weights2) + self.bias2)
        return hidden_layer, outputs
```