const tokenStore = {};

module.exports = {
    set: (token, { email, contact_no, expiry }) => {
        tokenStore[token] = { email, contact_no, expiry };
    },
    get: (token) => {
        return tokenStore[token];
    },
    remove: (token) => {
        delete tokenStore[token];
    }
};
