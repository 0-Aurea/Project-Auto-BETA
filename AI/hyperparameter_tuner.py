import numpy as np
from sklearn.model_selection import ParameterGrid, cross_val_score
from sklearn.base import clone
from sklearn.model_selection import train_test_split

class HyperparameterTuner:
    """
    Performs hyperparameter tuning using grid search and cross-validation.

    Evaluates all combinations of hyperparameters specified in param_grid,
    selecting the best combination based on cross-validated scoring metric.
    The best model is refit on the entire training data after selection.

    Attributes:
        model: The base model to be tuned.
        param_grid (dict): Dictionary with parameter names (string) as keys
            and lists of parameter settings to try as values.
        scoring (str, optional): A string or callable to evaluate the
            performance of the model on the test data.
        cv (int, optional): Number of folds for cross-validation.
    """

    def __init__(self, model, param_grid, scoring=None, cv=5):
        """
        Initialize the HyperparameterTuner.

        Args:
            model: The base model to be tuned.
            param_grid (dict): Dictionary with parameter names (string) as keys
                and lists of parameter settings to try as values.
            scoring (str, optional): A string or callable to evaluate the
                performance of the model on the test data. Defaults to None.
            cv (int, optional): Number of folds for cross-validation. Defaults to 5.
        """
        self.model = model
        self.param_grid = param_grid
        self.scoring = scoring
        self.cv = cv
        self.best_params_ = None
        self.best_score_ = None
        self.best_model_ = None

    def _validate_input(self, X, y):
        """
        Validate the input data.

        Args:
            X (array-like): The feature data.
            y (array-like): The target data.

        Raises:
            ValueError: If the input data is invalid.
        """
        if not isinstance(X, np.ndarray) or not isinstance(y, np.ndarray):
            raise ValueError("Invalid input data")

    def fit(self, X, y):
        """
        Perform hyperparameter tuning.

        Args:
            X (array-like): The feature data.
            y (array-like): The target data.

        Returns:
            self: The instance itself.
        """
        self._validate_input(X, y)

        param_grid = ParameterGrid(self.param_grid)
        best_score = -np.inf
        best_params = None

        for params in param_grid:
            model = clone(self.model)
            model.set_params(**params)

            scores = cross_val_score(model, X, y, cv=self.cv, scoring=self.scoring)

            score = np.mean(scores)

            if score > best_score:
                best_score = score
                best_params = params

        self.best_params_ = best_params
        self.best_score_ = best_score

        self.best_model_ = clone(self.model)
        self.best_model_.set_params(**best_params)
        self.best_model_.fit(X, y)

        return self

    def score(self, X, y):
        """
        Evaluate the best model on the given data.

        Args:
            X (array-like): The feature data.
            y (array-like): The target data.

        Returns:
            float: The score of the best model.
        """
        if self.best_model_ is None:
            raise ValueError("The best model has not been fitted yet")

        return self.best_model_.score(X, y)

# Example usage
if __name__ == "__main__":
    from sklearn.datasets import load_iris
    from sklearn.svm import SVC

    iris = load_iris()
    X = iris.data
    y = iris.target

    model = SVC()
    param_grid = {"C": [0.1, 1, 10], "kernel": ["linear", "rbf"]}

    tuner = HyperparameterTuner(model, param_grid)
    tuner.fit(X, y)

    print("Best parameters:", tuner.best_params_)
    print("Best score:", tuner.best_score_)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Score on test data:", tuner.score(X_test, y_test))