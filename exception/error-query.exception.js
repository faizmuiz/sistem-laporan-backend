// class ErrorQueryException extends Error {
//     constructor(message, data = {}) {
//         super();
//         this.message = message;
//         this.data = data;
//     }
// }

class ErrorQueryException extends Error {
    constructor(data) {
        super(typeof data === 'string' ? data : data.metaData.message);
        this.data = typeof data === 'string' ? undefined : data;
    }
}

module.exports = {
    ErrorQueryException,
};
