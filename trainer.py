CONTENT:
```python
import numpy as np
from neural_net import NeuralNetwork, ConvolutionalNeuralNetwork

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
                # Train convolutional neural network
                pass

    def evaluate(self):
        if isinstance(self.model, NeuralNetwork):
            _, outputs = self.model.forward(self.inputs)
            accuracy = np.mean(np.argmax(outputs, axis=1) == np.argmax(self.targets, axis=1))
            return accuracy
        elif isinstance(self.model, ConvolutionalNeuralNetwork):
            # Evaluate convolutional neural network
            outputs = self.model.forward(self.inputs)
            accuracy = np.mean(np.argmax(outputs, axis=1) == np.argmax(self.targets, axis=1))
            return accuracy
```