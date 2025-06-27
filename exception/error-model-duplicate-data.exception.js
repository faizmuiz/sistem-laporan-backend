class ErrorModelDuplicateDataException extends Error {
    constructor(message, data = null) {
        super();
        this.message = message ? message : "Data sudah diinputkan";
        this.data = data;
    }
}

module.exports = {
    ErrorModelDuplicateDataException,
};
