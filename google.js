const slugid = require('slugid');
const Url = require('url');
const got = require('got');
const { generators } = require('openid-client');
const { OAuth2Client } = require('google-auth-library');

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const DOMAIN = process.env.DOMAIN;

const oauthClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);

const states = {};

async function login(req, res) {
    const stateId = slugid.v4();
    const verifier = generators.codeVerifier();
    const challenge = generators.codeChallenge(verifier);
    states[stateId] = { verifier, challenge };

    const redirectUrl = Url.parse(AUTH_ENDPOINT, true);
    redirectUrl.query = {
        client_id: CLIENT_ID,
        scope: 'openid profile',
        response_type: 'code',
        redirect_uri: DOMAIN + '/callback/google',
        state: stateId,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    };

    console.log(Url.format(redirectUrl));
    return res.redirect(302, Url.format(redirectUrl));
};

async function callback(req, res) {
    const code = req.query.code;
    const stateId = req.query.state;
    const state = states[stateId];
    console.log({ code, stateId, state });

    const options = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: [
            'grant_type=authorization_code',
            `&code=${code}`,
            `&redirect_uri=${DOMAIN + '/callback/google'}`,
            `&client_id=${CLIENT_ID}`,
            `&client_secret=${CLIENT_SECRET}`,
            `&code_verifier=${state.verifier}`,
        ].join(''),
        responseType: 'json',
    };

    const tokenResp = await got.post(TOKEN_ENDPOINT, options);
    console.log(tokenResp.body);

    const ticket = await oauthClient.verifyIdToken({
        idToken: tokenResp.body.id_token,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userId = payload['sub'];
    const name = payload['name'];
    const email = 'hashed';

    console.log(payload);

    return res.render('hello', { name, email, userId });
};

exports.login = login;
exports.callback = callback;
