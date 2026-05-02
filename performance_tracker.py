```python
import numpy as np
import sqlite3
from neural_net import NeuralNetwork
from model_tracker import ModelTracker

class PerformanceTracker:
    def __init__(self, db_name):
        self.db_name = db_name
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        self.model_tracker = ModelTracker(db_name)

    def track_performance(self, neural_network):
        self.cursor.execute('SELECT input_data, target_data FROM training_examples')
        rows = self.cursor.fetchall()
        inputs = []
        targets = []
        for row in rows:
            inputs.append(np.array(eval(row[0])))
            targets.append(np.array(eval(row[1])))
        inputs = np.array(inputs)
        targets = np.array(targets)

        predictions = neural_network.predict(inputs)
        accuracy = np.sum(np.argmax(predictions, axis=1) == np.argmax(targets, axis=1)) / len(targets)
        loss = np.mean((predictions - targets) ** 2)

        self.model_tracker.store_performance(accuracy, loss)
        return accuracy, loss

    def get_performance_history(self):
        self.cursor.execute('SELECT accuracy, loss FROM performance_history')
        rows = self.cursor.fetchall()
        accuracy_history = []
        loss_history = []
        for row in rows:
            accuracy_history.append(row[0])
            loss_history.append(row[1])
        return np.array(accuracy_history), np.array(loss_history)

    def plot_performance(self):
        accuracy_history, loss_history = self.get_performance_history()
        import matplotlib.pyplot as plt
        plt.plot(accuracy_history)
        plt.xlabel('Iteration')
        plt.ylabel('Accuracy')
        plt.title('Accuracy Over Time')
        plt.show()

        plt.plot(loss_history)
        plt.xlabel('Iteration')
        plt.ylabel('Loss')
        plt.title('Loss Over Time')
        plt.show()
```