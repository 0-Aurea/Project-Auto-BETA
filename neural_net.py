import numpy as np
from typing import Tuple, List, Dict, Any, Optional
import os
import time


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
        """Initialize network with random weights using He initialization."""
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size

        # He initialization for weights
        self.weights_input_hidden = np.random.randn(hidden_size, input_size) * np.sqrt(2. / input_size)
        self.weights_hidden_output = np.random.randn(output_size, hidden_size) * np.sqrt(2. / hidden_size)
        
        # Biases initialized to zero
        self.bias_hidden = np.zeros((hidden_size, 1))
        self.bias_output = np.zeros((output_size, 1))

    def _relu(self, x: np.ndarray) -> np.ndarray:
        """Rectified Linear Unit activation function."""
        return np.maximum(0, x)

    def _relu_derivative(self, x: np.ndarray) -> np.ndarray:
        """Derivative of ReLU activation."""
        return (x > 0).astype(x.dtype)

    def _softmax(self, x: np.ndarray) -> np.ndarray:
        """Numerically stable softmax implementation."""
        exps = np.exp(x - np.max(x, axis=0))
        return exps / np.sum(exps, axis=0)

    def _compute_loss(self, y_pred: np.ndarray, y_true: np.ndarray) -> float:
        """Compute cross-entropy loss."""
        num_samples = y_true.shape[1]
        log_likelihoods = -np.log(y_pred[y_true, range(num_samples)] + 1e-8)
        return np.mean(log_likelihoods)

    def forward(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Perform forward propagation.
        
        Args:
            X: Input data of shape (input_size, num_samples)
            
        Returns:
            Tuple containing:
                hidden_activations: Activations of hidden layer
                output_activations: Final output probabilities
        """
        hidden_inputs = np.dot(self.weights_input_hidden, X) + self.bias_hidden
        hidden_activations = self._relu(hidden_inputs)
        output_inputs = np.dot(self.weights_hidden_output, hidden_activations) + self.bias_output
        output_activations = self._softmax(output_inputs)
        return hidden_activations, output_activations

    def backward(
        self,
        X: np.ndarray,
        y: np.ndarray,
        hidden_activations: np.ndarray,
        output_activations: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Perform backpropagation to compute gradients.
        
        Args:
            X: Input data
            y: True labels (one-hot encoded)
            hidden_activations: Activations from hidden layer
            output_activations: Output probabilities
            
        Returns:
            Gradients for all parameters
        """
        num_samples = X.shape[1]
        
        # Output layer error
        output_error = output_activations - y
        
        # Hidden layer error
        hidden_error = np.dot(self.weights_hidden_output.T, output_error) * self._relu_derivative(hidden_activations)
        
        # Compute gradients
        dW_hidden_output = np.dot(output_error, hidden_activations.T) / num_samples
        db_output = np.sum(output_error, axis=1, keepdims=True) / num_samples
        
        dW_input_hidden = np.dot(hidden_error, X.T) / num_samples
        db_hidden = np.sum(hidden_error, axis=1, keepdims=True) / num_samples
        
        return dW_input_hidden, db_hidden, dW_hidden_output, db_output

    def update_parameters(
        self,
        dW_input_hidden: np.ndarray,
        db_hidden: np.ndarray,
        dW_hidden_output: np.ndarray,
        db_output: np.ndarray,
        learning_rate: float
    ) -> None:
        """Update network parameters using gradient descent.
        
        Args:
            dW_input_hidden: Gradient of input-hidden weights
            db_hidden: Gradient of hidden bias
            dW_hidden_output: Gradient of hidden-output weights
            db_output: Gradient of output bias
            learning_rate: Learning rate for parameter updates
        """
        self.weights_input_hidden -= learning_rate * dW_input_hidden
        self.bias_hidden -= learning_rate * db_hidden
        
        self.weights_hidden_output -= learning_rate * dW_hidden_output
        self.bias_output -= learning_rate * db_output

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        epochs: int = 100,
        learning_rate: float = 0.01,
        batch_size: int = 32,
        validation_data: Optional[Tuple[np.ndarray, np.ndarray]] = None
    ) -> Dict[str, List[float]]:
        """Train the neural network using mini-batch gradient descent.
        
        Args:
            X_train: Training features of shape (input_size, num_samples)
            y_train: Training labels (one-hot encoded) of shape (output_size, num_samples)
            epochs: Number of training epochs
            learning_rate: Learning rate for optimization
            batch_size: Size of training batches
            validation_data: Optional validation data for monitoring
            
        Returns:
            Dictionary containing training history (loss, accuracy, etc.)
        """
        history = {
            'loss': [],
            'accuracy': [],
            'val_loss': [] if validation_data else None,
            'val_accuracy': [] if validation_data else None
        }
        
        num_samples = X_train.shape[1]
        batches_per_epoch = num_samples // batch_size
        
        for epoch in range(epochs):
            # Shuffle data at beginning of epoch
            indices = np.random.permutation(num_samples)
            X_shuffled = X_train[:, indices]
            y_shuffled = y_train[:, indices]
            
            epoch_loss = 0.0
            
            for batch_idx in range(batches_per_epoch):
                # Get current batch
                start_idx = batch_idx * batch_size
                end_idx = start_idx + batch_size
                
                X_batch = X_shuffled[:, start_idx:end_idx]
                y_batch = y_shuffled[:, start_idx:end_idx]
                
                # Forward pass
                _, output_activations = self.forward(X_batch)
                
                # Compute loss
                batch_loss = self._compute_loss(output_activations, y_batch)
                epoch_loss += batch_loss
                
                # Backward pass
                dW_input_hidden, db_hidden, dW_hidden_output, db_output = self.backward(
                    X_batch, y_batch, *self.forward(X_batch)
                )
                
                # Update parameters
                self.update_parameters(
                    dW_input_hidden, db_hidden,
                    dW_hidden_output, db_output,
                    learning_rate
                )
            
            # Compute metrics for full training set
            _, predictions = self.forward(X_train)
            train_accuracy = self._compute_accuracy(predictions, y_train)
            epoch_loss /= batches_per_epoch
            
            history['loss'].append(epoch_loss)
            history['accuracy'].append(train_accuracy)
            
            # Evaluate on validation set if provided
            if validation_data:
                X_val, y_val = validation_data
                _, val_predictions = self.forward(X_val)
                val_loss = self._compute_loss(val_predictions, y_val)
                val_accuracy = self._compute_accuracy(val_predictions, y_val)
                
                history['val_loss'].append(val_loss)
                history['val_accuracy'].append(val_accuracy)
            
            # Print progress every 10 epochs
            if (epoch + 1) % 10 == 0:
                val_str = f", Val Loss: {history['val_loss'][-1]:.4f}, Val Acc: {history['val_accuracy'][-1]:.4f}" \
                        if validation_data else ""
                print(f"Epoch {epoch+1}/{epochs} - Loss: {epoch_loss:.4f}, Acc: {train_accuracy:.4f}{val_str}")
                
        return history

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions on new data.
        
        Args:
            X: Input data of shape (input_size, num_samples)
            
        Returns:
            Predicted class probabilities
        """
        _, output_activations = self.forward(X)
        return output_activations

    def predict_classes(self, X: np.ndarray) -> np.ndarray:
        """Predict class labels for input data.
        
        Args:
            X: Input data of shape (input_size, num_samples)
            
        Returns:
            Array of predicted class indices
        """
        probabilities = self.predict(X)
        return np.argmax(probabilities, axis=0)

    def _compute_accuracy(self, y_pred: np.ndarray, y_true: np.ndarray) -> float:
        """Compute classification accuracy.
        
        Args:
            y_pred: Predicted probabilities
            y_true: True labels (one-hot encoded)
            
        Returns:
            Accuracy as a float between 0 and 1
        """
        predicted_classes = np.argmax(y_pred, axis=0)
        true_classes = np.argmax(y_true, axis=0)
        return np.mean(predicted_classes == true_classes)

    def save_model(self, file_path: str) -> None:
        """Save model parameters to disk.
        
        Args:
            file_path: Path to save the model
        """
        model_dir = os.path.dirname(file_path)
        if model_dir and not os.path.exists(model_dir):
            os.makedirs(model_dir)
            
        model_data = {
            'weights_input_hidden': self.weights_input_hidden,
            'weights_hidden_output': self.weights_hidden_output,
            'bias_hidden': self.bias_hidden,
            'bias_output': self.bias_output,
            'input_size': self.input_size,
            'hidden_size': self.hidden_size,
            'output_size': self.output_size
        }
        
        np.savez(file_path, **model_data)

    @classmethod
    def load_model(cls, file_path: str) -> 'NeuralNetwork':
        """Load model parameters from disk.
        
        Args:
            file_path: Path to load the model from
            
        Returns:
            NeuralNetwork instance with loaded parameters
        """
        with np.load(file_path) as data:
            model = cls(
                input_size=data['input_size'].item(),
                hidden_size=data['hidden_size'].item(),
                output_size=data['output_size'].item()
            )
            
            model.weights_input_hidden = data['weights_input_hidden']
            model.weights_hidden_output = data['weights_hidden_output']
            model.bias_hidden = data['bias_hidden']
            model.bias_output = data['bias_output']
            
            return model