// Create a browser-safe logger
const logger = {
  info: (...args) => {
    if (typeof window === 'undefined') {
      // Server-side
      const winston = require('winston');
      const serverLogger = winston.createLogger({
        transports: [
          new winston.transports.Console({
            format: winston.format.simple()
          })
        ]
      });
      serverLogger.info(...args);
    } else {
      // Client-side
      console.log(...args);
    }
  },
  error: (...args) => {
    if (typeof window === 'undefined') {
      const winston = require('winston');
      const serverLogger = winston.createLogger({
        transports: [
          new winston.transports.Console({
            format: winston.format.simple()
          })
        ]
      });
      serverLogger.error(...args);
    } else {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (typeof window === 'undefined') {
      const winston = require('winston');
      const serverLogger = winston.createLogger({
        transports: [
          new winston.transports.Console({
            format: winston.format.simple()
          })
        ]
      });
      serverLogger.warn(...args);
    } else {
      console.warn(...args);
    }
  },
  debug: (...args) => {
    if (typeof window === 'undefined') {
      const winston = require('winston');
      const serverLogger = winston.createLogger({
        transports: [
          new winston.transports.Console({
            format: winston.format.simple()
          })
        ]
      });
      serverLogger.debug(...args);
    } else {
      console.debug(...args);
    }
  }
};

export default logger; 