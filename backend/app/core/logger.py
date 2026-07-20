import sys
from loguru import logger

def setup_logging():
    # Remove default handler
    logger.remove()
    
    # Configure custom format matching standard professional logger
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    
    # Add console logger
    logger.add(
        sys.stderr,
        format=log_format,
        level="INFO",
        colorize=True,
    )
    
    # Add file logger (rotating files every day/size)
    logger.add(
        "logs/mymentor.log",
        rotation="10 MB",
        retention="10 days",
        format=log_format,
        level="INFO",
        encoding="utf-8",
    )
    
    logger.info("Logging system initialized successfully.")

# Initialize immediately on import
setup_logging()
