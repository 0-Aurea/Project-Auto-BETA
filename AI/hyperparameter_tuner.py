import numpy as np
from sklearn.model_selection import ParameterGrid, cross_val_score
from sklearn.base import clone


class HyperparameterTuner:
    """Performs hyperparameter tuning using grid search and cross-validation.

    Evaluates all combinations of hyperparameters specified in param_grid,
    selecting the best combination based on cross-validated scoring metric.
    The best model is refit on the entire training data after selection.
    """

    def __init__(self, model, param_grid, scoring='accuracy', cv=5):
        """Initialize HyperparameterTuner with model and hyperparameter grid.

        Parameters:
            model (estimator): Scikit-learn compatible model to tune.
            param_grid (dict): Dictionary of hyperparameters to search.
            scoring (str): Scoring metric for evaluation (default 'accuracy').
            cv (int): Number of cross-validation folds (default 5).
        """
        self.model = model
        self.param_grid = param_grid
        self.scoring = scoring
        self.cv = cv
        self.best_params_ = None
        self.best_score_ = None
        self.best_estimator_ = None

    def fit(self, X, y):
        """Fit the model with best hyperparameters on training data.

        Performs grid search to find optimal hyperparameters using cross-validation,
        then refits the best model on the entire dataset.

        Parameters:
            X (array-like): Training features.
            y (array-like): Training labels.

        Returns:
            self: Fitted tuner object.
        """
        best_score = -np.inf
        best_params = None

        for params in ParameterGrid(self.param_grid):
            model = clone(self.model)
            model.set_params(**params)
            scores = cross_val_score(model, X, y, scoring=self.scoring, cv=self.cv)
            mean_score = np.mean(scores)

            if mean_score > best_score:
                best_score = mean_score
                best_params = params

        self.best_params_ = best_params
        self.best_score_ = best_score

        # Refit the best model on the full dataset
        self.best_estimator_ = clone(self.model).set_params(**best_params)
        self.best_estimator_.fit(X, y)

        return self

    def predict(self, X):
        """Predict using the best fitted model.

        Parameters:
            X (array-like): Input features for prediction.

        Returns:
            array: Predicted labels.
        """
        return self.best_estimator_.predict(X)