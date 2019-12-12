const express = require('express'); // The default web applications framework. Use the expree module.
const app = express(); // Create an object of express module.
const path = require('path'); // The Path module provides utilities working with directories and file paths.
const bodyParser = require('body-parser'); // To handle HTTP POST request in Express.js
const bcrypt = require('bcrypt-nodejs');

app.use(express.json()); // Built-in middleware function in Express. It parses incoming requests with JSON payloads and is based on body-parser.
app.use(express.urlencoded({
    extended: false
})); // It parses incoming requests with urlencoded payloads and is based on body-parser.
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({
    limit: '100mb',
})); // Maximum request body size

app.post('/login', async (req, res, next) => {
    try {
        if (!req.body.emailAddress) {
            return res.status(422)
                .json({
                    success: false,
                    message: 'EmailId is required',
                });
        }
        if (!req.body.password) {
            return res.status(422)
                .json({
                    success: false,
                    message: 'Password is required',
                });
        }
        const member = await Member.findOne({
            where: {
                emailAddress: req.body.emailAddress,
            },
        });

        if (!member) {
            return res.json({
                success: false,
                message: `${req.body && req.body.emailAddress} is not registered.`,
            });
        }

        bcrypt.compare(req.body.password, member.password, (err, result) => {
            if (result) {
                return res.json({
                    success: true,
                    message: 'Successfully Logined',
                });
            } else {
                return res.json({
                    success: false,
                    message: 'Email Address or Password is Incorrect',
                });
            }
        });

    } catch (e) {
        return next(e);
    }
});

app.listen(5000, () => {
    console.log("Server Started");
}); // Make the server listen on port 3000.

module.exports = app;

