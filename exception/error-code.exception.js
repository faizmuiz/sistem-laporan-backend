class ErrorCodeException extends Error {
    constructor(message, data = {}) {
        super();
        this.message = message;
        this.data = data;
    }
}

module.exports = {
    ErrorCodeException,
};
