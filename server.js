const express = require('express');
const app = express();
const port = 8080;

// Define a basic route
app.get('/', (req, res) => {
    res.send('Hello World from Express!');
});

// Start the server
app.listen(port, () => {
    console.log(`Backend app listening at http://localhost:${port}`);
});