class ErrorLimitException extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

module.exports = {
    ErrorLimitException,
};
