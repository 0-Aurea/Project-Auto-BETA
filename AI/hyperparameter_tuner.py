import numpy as np
from sklearn.model_selection import ParameterGrid, cross_val_score, train_test_split
from sklearn.base import clone
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
from sklearn.metrics import accuracy_score

class HyperparameterTuner:
    def __init__(self, model, param_grid, scoring='accuracy', cv=5):
        self.model = model
        self.param_grid = param_grid
        self.scoring = scoring
        self.cv = cv
        self.best_params_ = None
        self.best_score_ = 0
        self.best_model_ = None

    def fit(self, X, y):
        for params in ParameterGrid(self.param_grid):
            self.model.set_params(**params)
            scores = cross_val_score(self.model, X, y, cv=self.cv, scoring=self.scoring)
            mean_score = scores.mean()
            if mean_score > self.best_score_:
                self.best_score_ = mean_score
                self.best_params_ = params
                self.best_model_ = clone(self.model).set_params(**params)
        return self

if __name__ == "__main__":
    data = load_iris()
    X, y = data.data, data.target
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LogisticRegression(solver='liblinear')
    param_grid = {
        'C': [0.1, 1, 10],
        'penalty': ['l1', 'l2']
    }

    tuner = HyperparameterTuner(model, param_grid, scoring='accuracy', cv=5)
    tuner.fit(X_train, y_train)

    print("Best Parameters:", tuner.best_params_)
    print("Best Score (CV):", tuner.best_score_)

    y_pred = tuner.best_model_.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)
    print("Test Accuracy:", test_accuracy)