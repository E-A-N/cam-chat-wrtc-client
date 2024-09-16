// server.js
const express = require('express');
const path = require('path');

const app = express();
const port = 7777;

// Middleware to log each request
app.use((req, res, next) => {
    console.log(`Received request for: ${req.url}`);
    next();
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}/`);
});
