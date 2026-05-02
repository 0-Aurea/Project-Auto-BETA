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
        hidden_layer = self.sigmoid(np.dot(inputs, self.weights1) + self.bias1)
        outputs = self.sigmoid(np.dot(hidden_layer, self.weights2) + self.bias2)

        output_error = targets - outputs
        output_delta = output_error * outputs * (1 - outputs)

        hidden_error = output_delta.dot(self.weights2.T)
        hidden_delta = hidden_error * hidden_layer * (1 - hidden_layer)

        self.weights2 += learning_rate * hidden_layer.T.dot(output_delta)
        self.bias2 += learning_rate * np.sum(output_delta, axis=0, keepdims=True)

        self.weights1 += learning_rate * inputs.T.dot(hidden_delta)
        self.bias1 += learning_rate * np.sum(hidden_delta, axis=0, keepdims=True)

class ConvolutionalNeuralNetwork:
    def __init__(self, input_channels, hidden_channels, output_size):
        self.input_channels = input_channels
        self.hidden_channels = hidden_channels
        self.output_size = output_size

        self.weights1 = np.random.rand(input_channels, hidden_channels, 5, 5)
        self.weights2 = np.random.rand(hidden_channels, output_size, 5, 5)

    def forward(self, inputs):
        outputs = np.zeros((inputs.shape[0], self.output_size, inputs.shape[2] - 4, inputs.shape[3] - 4))
        for i in range(inputs.shape[0]):
            for j in range(inputs.shape[1]):
                for k in range(self.hidden_channels):
                    for l in range(5):
                        for m in range(5):
                            outputs[i, k, j + l, inputs.shape[3] + m] += inputs[i, j, l, m] * self.weights1[j, k, l, m]

        return outputs

class RecurrentNeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size

        self.weights1 = np.random.rand(input_size, hidden_size)
        self.weights2 = np.random.rand(hidden_size, output_size)

    def forward(self, inputs):
        hidden_state = np.zeros((inputs.shape[0], self.hidden_size))
        outputs = np.zeros((inputs.shape[0], self.output_size))

        for i in range(inputs.shape[1]):
            hidden_state = np.tanh(np.dot(inputs[:, i], self.weights1) + hidden_state)
            outputs[:, i] = np.dot(hidden_state, self.weights2)

        return outputs
```