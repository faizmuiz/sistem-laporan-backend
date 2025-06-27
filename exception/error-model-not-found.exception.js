class ErrorModelNotFoundException extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

module.exports = {
    ErrorModelNotFoundException,
};
