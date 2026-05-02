import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
import logging

class DataPreprocessor:
    """Handles data preprocessing for machine learning pipelines.
    
    Attributes:
        data_path: Path to input dataset
        test_size: Proportion of dataset to use for testing
        random_state: Seed for random number generation
        logger: Logging handler for the class
    """
    
    def __init__(self, data_path, test_size=0.2, random_state=42):
        """Initializes the DataPreprocessor with dataset parameters.
        
        Args:
            data_path: Path to the dataset file
            test_size: Fraction of data to use for testing (0.0-1.0)
            random_state: Seed value for reproducibility
        """
        self.data_path = data_path
        self.test_size = test_size
        self.random_state = random_state
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)
        self._validate_inputs()
        
    def _validate_inputs(self):
        """Validates constructor inputs and file existence."""
        if not os.path.exists(self.data_path):
            self.logger.error(f"Data file not found at {self.data_path}")
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")
            
        if not 0 < self.test_size < 1:
            self.logger.error(f"test_size must be between 0 and 1, got {self.test_size}")
            raise ValueError("test_size must be between 0 and 1")
    
    def load_data(self):
        """Loads and inspects the dataset.
        
        Returns:
            pandas.DataFrame containing the dataset
        """
        try:
            self.logger.info(f"Loading data from {self.data_path}")
            self.data = pd.read_csv(self.data_path)
            self.logger.info(f"Loaded dataset with shape {self.data.shape}")
            return self.data
        except Exception as e:
            self.logger.error(f"Error loading data: {str(e)}")
            raise
    
    def split_data(self, target_column):
        """Splits data into training and testing sets.
        
        Args:
            target_column: Name of the target variable column
            
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        self.target_column = target_column
        self.logger.info(f"Splitting data with test size {self.test_size}")
        
        X = self.data.drop(columns=[target_column])
        y = self.data[target_column]
        
        return train_test_split(
            X, y,
            test_size=self.test_size,
            random_state=self.random_state
        )
    
    def create_preprocessor(self, numerical_features, categorical_features):
        """Creates preprocessing pipeline for numerical and categorical features.
        
        Args:
            numerical_features: List of numerical column names
            categorical_features: List of categorical column names
            
        Returns:
            ColumnTransformer preprocessing pipeline
        """
        self.numerical_features = numerical_features
        self.categorical_features = categorical_features
        
        numerical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('encoder', OneHotEncoder(handle_unknown='ignore'))
        ])
        
        self.preprocessor = ColumnTransformer([
            ('num', numerical_pipeline, numerical_features),
            ('cat', categorical_pipeline, categorical_features)
        ])
        
        return self.preprocessor
    
    def preprocess_data(self, X_train, X_test):
        """Applies preprocessing to training and test data.
        
        Args:
            X_train: Training features
            X_test: Test features
            
        Returns:
            Tuple of (processed X_train, processed X_test)
        """
        self.logger.info("Starting data preprocessing")
        self.preprocessor.fit(X_train)
        return (
            self.preprocessor.transform(X_train),
            self.preprocessor.transform(X_test)
        )