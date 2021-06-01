require('dotenv').config();

const _ = require('lodash');
const express = require('express');
const app = express();
const port = process.env.PORT | 3000;

const amazon = require('./amazon');
const google = require('./google');
const twitter = require('./twitter');

app.set('view engine', 'squirrelly');

app.get('/', (req, res) => {
    res.render('home');
});

function safen(fn) {
    return async (req, res) => {
        try {
            return await fn(req, res);
        }
        catch(error) {
            const options = _.get(error, 'request.options');
            const body = _.get(error, 'response.body');
            console.error(error.message, options, body);
            return res.status(500).send(error.message);
        }
    }
}

app.get('/login/amazon', safen(amazon.login));
app.get('/callback/amazon', safen(amazon.callback));

app.get('/login/google', safen(google.login));
app.get('/callback/google', safen(google.callback));

app.get('/login/twitter', safen(twitter.login));
app.get('/callback/twitter', safen(twitter.callback));

const server = app.listen(port, () => {
    console.log('Listening on port ' + port);
});
