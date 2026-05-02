CONTENT:
```python
import numpy as np
from neural_net import NeuralNetwork, ConvolutionalNeuralNetwork, RecurrentNeuralNetwork
from trainer import Trainer

def main():
    np.random.seed(0)

    # Initialize neural network
    neural_network = NeuralNetwork(2, 2, 1)

    # Create training data
    inputs = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
    targets = np.array([[0], [1], [1], [0]])

    # Create trainer
    trainer = Trainer(neural_network, inputs, targets)

    # Train neural network
    trainer.train(0.1, 1000)

    # Initialize convolutional neural network
    convolutional_neural_network = ConvolutionalNeuralNetwork(1, 10, 10)

    # Create training data for convolutional neural network
    inputs_conv = np.random.rand(100, 1, 10, 10)
    targets_conv = np.random.rand(100, 10)

    # Create trainer for convolutional neural network
    trainer_conv = Trainer(convolutional_neural_network, inputs_conv, targets_conv)

    # Train convolutional neural network
    trainer_conv.train(0.1, 1000)

    # Initialize recurrent neural network
    recurrent_neural_network = RecurrentNeuralNetwork(1, 10, 1)

    # Create training data for recurrent neural network
    inputs_rec = np.random.rand(100, 1, 10)
    targets_rec = np.random.rand(100, 1)

    # Create trainer for recurrent neural network
    trainer_rec = Trainer(recurrent_neural_network, inputs_rec, targets_rec)

    # Train recurrent neural network
    trainer_rec.train(0.1, 1000)
```