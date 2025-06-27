class ErrorSyncronization extends Error {
    constructor(message = null) {
        super();
        this.message = message ? message : "Synchronization failed!";
    }
}

module.exports = {
    ErrorSyncronization,
};
