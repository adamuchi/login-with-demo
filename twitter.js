const slugid = require('slugid');
const { generator } = require('openid-client');

const endpoints = {
    requestToken: 'https://api.twitter.com/oauth/request_token',
    accessToken: 'https://api.twitter.com/oauth/access_token',
    authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
};

async function login(req, res) {
    return res.status(500).send('Not implemented');
}

async function callback(req, res) {
    throw new Error('whoops');
    return res.status(500).send('Not implemented');
}

exports.login = login;
exports.callback = callback;
