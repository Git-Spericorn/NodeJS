const express = require('express'); // The default web applications framework. Use the expree module.
const app = express(); // Create an object of express module.
const path = require('path'); // The Path module provides utilities working with directories and file paths.
const bodyParser = require('body-parser'); // To handle HTTP POST request in Express.js
const bcrypt = require('bcrypt-nodejs');
const nodemailer = require('nodemailer');
const config = require('config');
const uuidv1 = require('uuid/v1');
const Joi = require('@hapi/joi'); // for validation

app.use(express.json()); // Built-in middleware function in Express. It parses incoming requests with JSON payloads and is based on body-parser.
app.use(express.urlencoded({
    extended: false
})); // It parses incoming requests with urlencoded payloads and is based on body-parser.
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({
    limit: '100mb',
})); // Maximum request body size

// Login User.
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

// User Registration
app.post('/userRegistration', async (req, res, next) => {
    try {
        await validator(req.body);

        const existingMember = await Member.findOne({
            where: {
                emailAddress: req.body.emailAddress,
            },
        });
        if (existingMember) {
            return res.json({
                success: false,
                message: 'This email id is already registered',
            });
        }
        if (!req.body.emailAddress) {
            return res.json({
                success: false,
                message: 'EmailId is required',
            });
        }
        const member = await Member.create({
            emailAddress: req.body.emailAddress,
            password: bcrypt.hashSync(req.body.password),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phoneNumber: req.body.phoneNumber,
            place: req.body.place,
        },);

        let key = uuidv1();
        key = key.replace(/-/g, '');
       
        const env = process.env.NODE_ENV || 'development';
        const verificationUrl = `${config.app.clientURL}/user/login?key=${key}`;
        // mail sending starts
        const transporter = nodemailer.createTransport({
            ...config.mailer
        });

        const mailOptions = {
            from: config.mailer.auth.user,
            to: req.body.emailAddress,
            subject: 'Activate link ',
            html: `<b>Click on this link to activate your  account.<a href="${verificationUrl}">Click Here</a></b>`
        };

        (async () => {
            const info = await transporter.sendMail(mailOptions);
            console.log(
                `Email sent from ${mailOptions.from} to ${mailOptions.to}. Info--->${
                    info.response
                    }`,
            );
        })();
        return res.json({
            success: true,
            message: 'User Registered Successfully ...',
            member
        });
    } 
    catch (e) {
        if (e.name === 'ValidationError') {
            return res.status(422)
                .json({
                    success: false,
                    message: 'Invalid request data',
                    data: e.details,
                });
        }
        next(e);
    }
    // validation 
    function validator(body) {
        const schema = {
            emailAddress: Joi.string()
                .email()
                .required(),
            password: Joi.string()
                .password()
                .min(6)
                .max(20)
                .required(),
            phoneNumber: Joi.number()
                .regex(/^\d{3}-\d{3}-\d{4}$/)
                .required(),
            firstName: Joi.string()
                .required(),
            lastName: Joi.string()
                .required(),
            place: Joi.string()
            .required(),
        };
        
        return Joi.validate(body, schema, {
            convert: true,
            abortEarly: true,
        });
    }
});


// list of registered users names.
exports.getName = async (req, res, next) => {
    try {
        const member = await Member.findAll({
            attributes: ['id', 'firstName', 'lastName'],
        });
        return res.json({
            success: true,
            message: 'Fetch Successfully',
            data: {
                member,
            },
        });
    } catch (e) {
        console.error('something went wtorng : ', e);
        return next(e);
    }
};


app.listen(5000, () => {
    console.log("Server Started");
}); // Make the server listen on port 5000.

module.exports = app;

