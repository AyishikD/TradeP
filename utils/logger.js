const fs = require('fs');
const path = require('path');
const util = require('util');

const logFilePath = path.join(__dirname, '../logs/app.log'); // Log file location
const logToFile = true; // Set to false if you only want console logs

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

/**
 * Format the log message as a JSON object
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {object} [data] - Additional data (optional)
 * @returns {string} - JSON formatted log string
 */
function formatLog(level, message, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  });
}

/**
 * Write logs to a file asynchronously
 * @param {string} logMessage - The formatted log message
 */
const writeLogToFile = util.promisify(fs.appendFile);

/**
 * Log a message to the console and optionally to a file
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {object} [data] - Additional metadata
 */
async function log(level, message, data = {}) {
  const formattedMessage = formatLog(level, message, data);
  
  // Print to console
  if (level === 'error') {
    console.error(formattedMessage);
  } else {
    console.log(formattedMessage);
  }

  // Save to file if enabled
  if (logToFile) {
    try {
      await writeLogToFile(logFilePath, formattedMessage + '\n');
    } catch (err) {
      console.error('Error writing log to file:', err);
    }
  }
}

// Convenience functions for different log levels
const logger = {
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),
};

module.exports = logger;
