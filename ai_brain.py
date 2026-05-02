CONTENT:
```python
import numpy as np
from neural_net import NeuralNetwork, ConvolutionalNeuralNetwork, RecurrentNeuralNetwork, Transformer
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

    # Test convolutional neural network
    conv_net = ConvolutionalNeuralNetwork(1, 10, 10)
    conv_trainer = Trainer(conv_net, inputs, targets)
    conv_trainer.train(0.1, 1000)

    # Test recurrent neural network
    recurrent_net = RecurrentNeuralNetwork(1, 10, 1)
    recurrent_trainer = Trainer(recurrent_net, inputs, targets)
    recurrent_trainer.train(0.1, 1000)

    # Test transformer
    transformer_model = Transformer(1, 10, 1)
    transformer_trainer = Trainer(transformer_model, inputs, targets)
    transformer_trainer.train(0.1, 1000)

if __name__ == "__main__":
    main()
```