const winston = require('winston');

// Create a custom logger
const logger = winston.createLogger({
  level: 'info', // Default logging level
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple() // Log format with simple text output
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/app.log', level: 'info' }) // Add file transport for persistence
  ]
});

// Custom logging middleware for Express
function logRequest(req, res, next) {
  logger.info(`Request: ${req.method} ${req.url}`);
  next();
}

// Error logging middleware for Express
function logError(err, req, res, next) {
  logger.error(`Error: ${err.message}, Stack: ${err.stack}`);
  res.status(500).json({ message: 'Internal Server Error' });
}

module.exports = { logger, logRequest, logError };
