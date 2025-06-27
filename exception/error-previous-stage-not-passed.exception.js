class ErrorPreviousStageNotPassed extends Error {
    constructor(message = null) {
        super();
        this.message = message ? message : "All previous stage status must be passed!";
    }
}

module.exports = {
    ErrorPreviousStageNotPassed,
};
