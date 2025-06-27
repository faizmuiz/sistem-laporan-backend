const ErrorAuthenticationException = require("../exception/error-authentication.exception").ErrorAuthenticationException;
const tokenService = require('../src/service/token.service');

// repository
const repoAuth = require('../src/repository/auth.repository');

// general (admin or agent)
const tokenValidation = async (req, res, next) => {
    try {
        // 1. check token on header 'Authorization' and 'x-api-key'
        const token = req.get('Authorization');
        const key = req.get('x-api-key');
        const timezone = req.get('timezone');
        const utcOffset = req.get('utc-offset');

        if (!token.substr(7) || !req.get('x-api-key')) {
            throw new ErrorAuthenticationException('Token not found!');
        }

        // 2. check token validation
        const tokenRemoveBearer = removeBearerPrefix(token);
        const account_id = await tokenService.checkAuthToken(tokenRemoveBearer, key);
        if (!account_id) {
            throw new ErrorAuthenticationException('Token expired or not authorized.');
        }

        // 3. get user/account
        let resultAccount = await repoAuth.getOne(account_id);
        resultAccount.timezone = timezone ? timezone : "Asia/Jakarta"; // default set to timezone "Asia/Jakarta"
        resultAccount.utc_offset = utcOffset ? utcOffset : "+07:00"

        req.user = resultAccount;

        next();
    } catch (error) {
        next(error);
    }
}

// admin
const tokenValidationAdmin = async (req, res, next) => {
    try {
        // 1. check token on header 'Authorization' and 'x-api-key'
        const token = req.get('Authorization');
        const key = req.get('x-api-key');
        const timezone = req.get('timezone');
        const utcOffset = req.get('utc-offset');

        if (!token.substr(7) || !req.get('x-api-key')) {
            throw new ErrorAuthenticationException('Token not found!');
        }

        // 2. check token validation
        const tokenRemoveBearer = removeBearerPrefix(token);
        const account_id = await tokenService.checkAuthToken(tokenRemoveBearer, key);
        if (!account_id) {
            throw new ErrorAuthenticationException('Token expired or not authorized.');
        }

        // 3. get user/account
        let resultAccount = await repoAuth.getOne(account_id);
        resultAccount.timezone = timezone ? timezone : "Asia/Jakarta"; // default set to timezone "Asia/Jakarta"
        resultAccount.utc_offset = utcOffset ? utcOffset : "+07:00"

        // 4. check role_id
        if (resultAccount.role_id != "ADMIN") {
            throw new ErrorAuthenticationException('Token expired or not authorized.');
        }

        req.user = resultAccount;

        next();
    } catch (error) {
        next(error);
    }
}

// user
const tokenValidationUser = async (req, res, next) => {
    try {
        // 1. check token on header 'Authorization' and 'x-api-key'
        const token = req.get('Authorization');
        const key = req.get('x-api-key');
        const timezone = req.get('timezone');
        const utcOffset = req.get('utc-offset');

        if (!token.substr(7) || !req.get('x-api-key')) {
            throw new ErrorAuthenticationException('Token not found!');
        }

        // 2. check token validation
        const tokenRemoveBearer = removeBearerPrefix(token);
        const account_id = await tokenService.checkAuthToken(tokenRemoveBearer, key);
        if (!account_id) {
            throw new ErrorAuthenticationException('Token expired or not authorized.');
        }

        // 3. get user/account
        let resultAccount = await repoAuth.getOne(account_id);
        resultAccount.timezone = timezone ? timezone : "Asia/Jakarta"; // default set to timezone "Asia/Jakarta"
        resultAccount.utc_offset = utcOffset ? utcOffset : "+07:00"

        // 4. check role_id
        if (resultAccount.role_id != "USER") {
            throw new ErrorAuthenticationException('Token expired or not authorized.');
        }

        req.user = resultAccount;

        next();
    } catch (error) {
        next(error);
    }
}

const removeBearerPrefix = (tokenWithBearer) => {
    if (tokenWithBearer?.startsWith('Bearer ')) {
        const tokenWithoutBearer = tokenWithBearer.substr(7);

        return tokenWithoutBearer;
    } else {
        throw new ErrorAuthenticationException('Invalid Bearer token format!');
    }
}

module.exports = {
    tokenValidation,
    tokenValidationAdmin,
    tokenValidationUser,
}
