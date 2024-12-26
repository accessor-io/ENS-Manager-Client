"""Logging module for ENS Manager."""

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Optional

from .config import Config

class Logger:
    """Logger for ENS Manager."""
    
    def __init__(self, config: Config):
        """Initialize logger.
        
        Args:
            config: Configuration instance
        """
        self.config = config
        self.logger = logging.getLogger('ens_manager')
        self.logger.setLevel(logging.INFO)
        
        # Create formatters
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_formatter = logging.Formatter(
            '%(levelname)s: %(message)s'
        )
        
        # File handler
        log_file = Path(config.get_setting('log_dir')) / 'ens_manager.log'
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(file_formatter)
        self.logger.addHandler(file_handler)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
    def debug(self, message: str):
        """Log debug message.
        
        Args:
            message: Message to log
        """
        self.logger.debug(message)
        
    def info(self, message: str):
        """Log info message.
        
        Args:
            message: Message to log
        """
        self.logger.info(message)
        
    def warning(self, message: str):
        """Log warning message.
        
        Args:
            message: Message to log
        """
        self.logger.warning(message)
        
    def error(self, message: str, exc_info: Optional[Exception] = None):
        """Log error message.
        
        Args:
            message: Message to log
            exc_info: Exception information
        """
        self.logger.error(message, exc_info=exc_info)
        
    def critical(self, message: str, exc_info: Optional[Exception] = None):
        """Log critical message.
        
        Args:
            message: Message to log
            exc_info: Exception information
        """
        self.logger.critical(message, exc_info=exc_info)
        
    def set_level(self, level: str):
        """Set logging level.
        
        Args:
            level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        """
        self.logger.setLevel(getattr(logging, level.upper())) 