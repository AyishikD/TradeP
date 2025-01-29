const http = require('http');
const app = require('./app');  // Import app.js to use the app configuration

const port = process.env.PORT || 3000;

// Create the HTTP server using the app configuration
const server = http.createServer(app);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
