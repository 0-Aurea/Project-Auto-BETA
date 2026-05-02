CONTENT:
# Neural Network App

This is a simple web application that allows users to input 784 comma-separated values and receive a prediction from a neural network.

## Models

The application currently supports two models:

*   Simple Neural Network: A basic neural network with one hidden layer.
*   Convolutional Neural Network: A convolutional neural network with multiple layers.

## Usage

1.  Run the application by executing `python app.py` in the terminal.
2.  Open a web browser and navigate to `http://localhost:5000`.
3.  Enter 784 comma-separated values in the input field.
4.  Select a model type from the dropdown menu.
5.  Click the "Make Prediction" button to receive a prediction.

## Notes

*   The application uses the MNIST dataset for training the models.
*   The models are trained on the server-side and saved for later use.
*   The application uses Flask for the web interface and PyTorch for the neural networks.