const tokenStore = {};

module.exports = {
    set: (token, { email, account_type, expiry }) => {
        tokenStore[token] = { email, account_type, expiry };
    },
    get: (token) => {
        return tokenStore[token];
    },
    remove: (token) => {
        delete tokenStore[token];
    }
};
