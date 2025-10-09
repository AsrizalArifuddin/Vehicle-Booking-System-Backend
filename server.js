require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const app = express();

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
    cookieSession({
        name: "booking-session",
        keys: ["process.env.COOKIE_SECRET"],
        httpOnly: true,
    })
);

const port = 8080;

// Define a basic route
app.get('/', (req, res) => {
    res.send('Welcome to Vehicle Booking System!');
});

// routes
require('./app/routes/auth_routes')(app);
require('./app/routes/board_routes')(app);
require('./app/routes/port_routes')(app);

// Start the server
app.listen(port, () => {
    console.log(`Backend app listening at http://localhost:${port}`);
});