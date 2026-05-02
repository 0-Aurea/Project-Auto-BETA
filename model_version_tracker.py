```python
import sqlite3
import numpy as np
from neural_net import NeuralNetwork

class ModelVersionTracker:
    def __init__(self, db_name):
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''CREATE TABLE IF NOT EXISTS model_versions
                             (id INTEGER PRIMARY KEY AUTOINCREMENT, model TEXT, accuracy REAL)''')
        self.conn.commit()

    def store_model_version(self, model, accuracy):
        self.cursor.execute("INSERT INTO model_versions (model, accuracy) VALUES (?, ?)",
                            (str(model), accuracy))
        self.conn.commit()

    def get_model_versions(self):
        self.cursor.execute("SELECT * FROM model_versions")
        return self.cursor.fetchall()

    def get_latest_model_version(self):
        self.cursor.execute("SELECT * FROM model_versions ORDER BY id DESC LIMIT 1")
        return self.cursor.fetchone()

    def update_model_version(self, model_id, accuracy):
        self.cursor.execute("UPDATE model_versions SET accuracy = ? WHERE id = ?",
                            (accuracy, model_id))
        self.conn.commit()

    def delete_model_version(self, model_id):
        self.cursor.execute("DELETE FROM model_versions WHERE id = ?",
                            (model_id,))
        self.conn.commit()

def main():
    tracker = ModelVersionTracker('model_versions.db')

    # Create a simple neural network
    neural_network = NeuralNetwork(2, 2, 1)

    # Train the neural network
    inputs = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
    targets = np.array([[0], [1], [1], [0]])
    neural_network.train(inputs, targets, 0.1)

    # Store the model version
    tracker.store_model_version(str(neural_network), 0.9)

    # Get all model versions
    model_versions = tracker.get_model_versions()
    for version in model_versions:
        print(version)

if __name__ == "__main__":
    main()
```