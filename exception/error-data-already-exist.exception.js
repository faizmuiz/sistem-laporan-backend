class ErrorDataAlreadyExistException extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
}

module.exports = {
    ErrorDataAlreadyExistException,
};
