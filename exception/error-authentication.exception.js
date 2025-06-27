class ErrorAuthenticationException extends Error {
    constructor(message, data = null) {
        super();
        this.message = message;
        this.data = data;
    }
}
  
module.exports = {
    ErrorAuthenticationException,
}
