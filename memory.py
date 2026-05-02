import torch
import logging

class MemoryManager:
    """
    Manages and logs system memory usage, primarily for GPU resources.

    Attributes:
        logger (logging.Logger): Logger instance for MemoryManager.
    """

    def __init__(self):
        """
        Initialize logger with proper configuration.
        """
        self.logger = logging.getLogger(__name__)
        if not self.logger.handlers:
            logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    def log_memory_usage(self):
        """
        Log current GPU memory allocation and reservation status.

        Raises:
            AssertionError: If CUDA is not available.
        """
        if torch.cuda.is_available():
            torch_memory_info = torch.cuda.mem_get_info()
            allocated = torch.cuda.memory_allocated()
            reserved = torch.cuda.memory_reserved()
            self.logger.info(f"GPU Memory Info: allocated={allocated / (1024 * 1024):.2f}MB, reserved={reserved / (1024 * 1024):.2f}MB")
        else:
            self.logger.warning("CUDA is not available. Cannot log GPU memory usage.")
            assert torch.cuda.is_available(), "CUDA is not available."