import torch
import logging

class MemoryManager:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def log_memory_usage(self):
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / 1e6  # Convert to MB
            reserved = torch.cuda.memory_reserved() / 1e6
            self.logger.info(f"GPU Memory - Allocated: {allocated:.2f} MB, Reserved: {reserved:.2f} MB")
        else:
            self.logger.info("CUDA not available. Use CPU memory (no tracking available).")

    def clear_cache(self):
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            self.logger.info("CUDA cache cleared.")
        else:
            self.logger.info("No GPU cache to clear.")

if __name__ == "__main__":
    mm = MemoryManager()
    mm.log_memory_usage()
    mm.clear_cache()