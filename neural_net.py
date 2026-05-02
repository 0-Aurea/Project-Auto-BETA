import numpy as np
from typing import Tuple, List, Dict, Any, Optional


class NeuralNetwork:
    """A simple feedforward neural network with one hidden layer.
    
    Attributes:
        input_size: Number of input features
        hidden_size: Number of neurons in hidden layer
        output_size: Number of output classes
        weights_input_hidden: Input-to-hidden layer weights
        weights_hidden_output: Hidden-to-output layer weights
        bias_hidden: Hidden layer bias
        bias_output: Output layer bias
    """

    def __init__(self, input_size: int, hidden_size: int, output_size: int):
        """Initialize network with given layer dimensions."""
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        
        # He initialization for ReLU activation
        self.weights_input_hidden = np.random.randn(input_size, hidden_size) * np.sqrt(2./input_size)
        self.bias_hidden = np.zeros((1, hidden_size))
        
        self.weights_hidden_output = np.random.randn(hidden_size, output_size) * np.sqrt(2./hidden_size)
        self.bias_output = np.zeros((1, output_size))

    def forward(self, X: np.ndarray) -> np.ndarray:
        """Compute forward pass through the network."""
        self.hidden_input = np.dot(X, self.weights_input_hidden) + self.bias_hidden
        self.hidden_output = self._relu(self.hidden_input)
        self.output = np.dot(self.hidden_output, self.weights_hidden_output) + self.bias_output
        return self._softmax(self.output)

    def _relu(self, X: np.ndarray) -> np.ndarray:
        """Rectified Linear Unit activation function."""
        return np.maximum(0, X)

    def _softmax(self, X: np.ndarray) -> np.ndarray:
        """Numerically stable softmax implementation."""
        exps = np.exp(X - np.max(X, axis=1, keepdims=True))
        return exps / np.sum(exps, axis=1, keepdims=True)

    def train(self, X: np.ndarray, y: np.ndarray, 
              learning_rate: float = 0.01, epochs: int = 100) -> None:
        """Train the network using stochastic gradient descent."""
        for _ in range(epochs):
            # Forward pass
            output = self.forward(X)
            
            # Backward pass
            output_error = output - y
            hidden_error = np.dot(output_error, self.weights_hidden_output.T)
            hidden_error[self.hidden_input <= 0] = 0  # ReLU derivative
            
            # Gradient descent update
            self.weights_hidden_output -= learning_rate * np.dot(
                self.hidden_output.T, output_error)
            self.bias_output -= learning_rate * np.sum(output_error, axis=0)
            
            self.weights_input_hidden -= learning_rate * np.dot(
                X.T, hidden_error)
            self.bias_hidden -= learning_rate * np.sum(hidden_error, axis=0)