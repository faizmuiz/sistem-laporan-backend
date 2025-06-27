const { validationResult } = require("express-validator");

const ErrorInvalidParameterException = require("../exception/error-invalid-parameter.exception").ErrorInvalidParameterException;

module.exports = (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ErrorInvalidParameterException(
                "Invalid request body!",
                errors.array().map((item) => {
                    const err = {};

                    err.location = item.location;
                    err.field = item.path;
                    err.message = item.msg;

                    return err;
                })
            );
        }
        next();
    } catch (error) {
        next(error);
    }
};
