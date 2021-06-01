const slugid = require('slugid');
const Url = require('url');
const got = require('got');
const { generators } = require('openid-client');

// https://developer.amazon.com/docs/login-with-amazon/authorization-code-grant.html
// https://developer.amazon.com/docs/login-with-amazon/obtain-customer-profile.html
const AUTH_ENDPOINT = 'https://www.amazon.com/ap/oa';
const TOKEN_ENDPOINT = 'https://api.amazon.com/auth/o2/token';
const PROFILE_ENDPOINT = 'https://api.amazon.com/user/profile';

const CLIENT_ID = process.env.AMAZON_CLIENT_ID;
const CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;

const DOMAIN = process.env.DOMAIN;

const states = {};

async function login (req, res) {
    const stateId = slugid.v4();
    const verifier = generators.codeVerifier();
    const challenge = generators.codeChallenge(verifier);
    states[stateId] = { verifier, challenge };

    const redirectUrl = Url.parse(AUTH_ENDPOINT, true);
    redirectUrl.query = {
        client_id: CLIENT_ID,
        scope: 'profile profile:user_id',
        response_type: 'code',
        redirect_uri: DOMAIN + '/callback/amazon',
        state: stateId,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    };

    console.log(Url.format(redirectUrl));
    return res.redirect(302, Url.format(redirectUrl));
}

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
            `&redirect_uri=${DOMAIN + '/callback/amazon'}`,
            `&client_id=${CLIENT_ID}`,
            `&client_secret=${CLIENT_SECRET}`,
            `&code_verifier=${state.verifier}`,
        ].join(''),
        responseType: 'json',
    };

    const tokenResp = await got.post(TOKEN_ENDPOINT, options);
    console.log(tokenResp.body);

    const profileUrl = Url.parse(PROFILE_ENDPOINT, true);
    profileUrl.query = {
        access_token: tokenResp.body.access_token,
    };

    console.log(Url.format(profileUrl));
    const profileResp = await got.get(Url.format(profileUrl), { responseType: 'json' });
    console.log(profileResp.body);

    return res.render('hello', {
        name: profileResp.body.name,
        email: profileResp.body.email,
        userId: profileResp.body.user_id,
    });
}

exports.login = login;
exports.callback = callback;
