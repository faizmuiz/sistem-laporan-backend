class ErrorNotFoundException extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

module.exports = {
    ErrorNotFoundException,
};
