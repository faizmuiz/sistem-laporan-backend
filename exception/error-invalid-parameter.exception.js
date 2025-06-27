class ErrorInvalidParameterException extends Error {
    constructor(message, data = null) {
        super();
        this.message = message ? message : "Invalid parameter!";
        this.data = data;
    }
}

module.exports = {
    ErrorInvalidParameterException,
};
