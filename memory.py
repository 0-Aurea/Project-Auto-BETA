import torch
import logging


class MemoryManager:
    """Manages and logs system memory usage, primarily for GPU resources."""
    
    def __init__(self):
        """Initialize logger with proper configuration."""
        self.logger = logging.getLogger(__name__)
        if not self.logger.handlers:
            logging.basicConfig(level=logging.INFO)
    
    def log_memory_usage(self):
        """Log current GPU memory allocation and reservation status."""
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / 1e6  # Convert to MB
            reserved = torch.cuda.memory_reserved() / 1e6
            self.logger.info(f"GPU Memory - Allocated: {allocated:.2f} MB, Reserved: {reserved:.2f} MB")
        else:
            self.logger.warning("CUDA is not available. GPU memory monitoring disabled.")