const { ErrorNotFoundException } = require("./error-not-found.exception");
const { ErrorDataAlreadyExistException } = require("./error-data-already-exist.exception");
const { ErrorInvalidParameterException } = require("./error-invalid-parameter.exception");
const { ErrorCodeException } = require("./error-code.exception");
const { ErrorModelNotFoundException } = require("./error-model-not-found.exception");
const { ErrorModelDuplicateDataException } = require("./error-model-duplicate-data.exception");
const { ErrorQueryException } = require("./error-query.exception");
const { ErrorAuthenticationException } = require("./error-authentication.exception");
const { ErrorLimitException } = require("./error-limit.exception");
const { ErrorPreviousStageNotPassed } = require("./error-previous-stage-not-passed.exception");
const { ErrorSyncronization } = require("./error-syncronization.exception");

const urlValidation = (req, res, next) => {
    throw new ErrorNotFoundException("Url Not Found");
};

const handleErrors = (err, req, res, next) => {
    if (err instanceof ErrorModelNotFoundException) {
        return res.status(200).json({
            response: {},
            metaData: {
                message: `Ops, ${err.message ? err.message : 'Data tidak ditemukana.'}`,
                code: 200,
                response_code: "5574",
            },
        });
    }

    if (err instanceof ErrorAuthenticationException) {
        return res.status(401).json({
            response: {},
            metaData: {
                message: `${err.message ? err.message : 'Not authenticated, wrong username or password.'}`,
                code: 401,
                response_code: '0001',
            },
        })
    }

    if (err instanceof ErrorNotFoundException) {
        return res.status(404).json({
            response: {},
            metaData: {
                message: `${err.message ? err.message : 'Data not found.'}`,
                code: 404,
                response_code: "0001",
            },
        });
    }

    if (err instanceof ErrorDataAlreadyExistException) {
        return res.status(422).json({
            response: {},
            metaData: {
                message: `${err.message ? err.message : 'Data has been used.'}`,
                code: 422,
                response_code: "0001",
            },
        });
    }

    if (err instanceof ErrorInvalidParameterException) {
        return res.status(422).json({
            response: {
                error: err.data
            },
            metaData: {
                message: err.message,
                code: 422,
                response_code: "5505",
            },
        });
    }

    if (err instanceof ErrorModelDuplicateDataException) {
        return res.status(422).json({
            response: err.data,
            metaData: {
                message: "Ops, " + err.message,
                code: 422,
                response_code: "5542",
            },
        });
    }

    if (err instanceof ErrorCodeException) {
        return res.status(500).json({
            response: err.data,
            metaData: {
                message: `${err.message ? err.message : 'Internal server error.'}`,
                code: 500,
                response_code: "0001",
            },
        });
    }

    // if (err instanceof ErrorQueryException) {
    //     return res.status(err.data.metaData.code).json({
    //         response: err.data.data,
    //         metaData: {
    //             message: "Ops, terjadi kesalahan query. " + err.data.metaData.message,
    //             code: err.data.metaData.code,
    //             response_code: err.data.metaData.response_code,
    //         },
    //     });
    // }

    if (err instanceof ErrorQueryException) {
        const statusCode = err.data?.metaData?.code || 500;
        return res.status(statusCode).json({
            response: err.data?.data || {},
            metaData: {
                message: "Ops, terjadi kesalahan query. " + (err.data?.metaData?.message || err.message),
                code: statusCode,
                response_code: err.data?.metaData?.response_code || "0001",
            },
        });
    }

    if (err instanceof ErrorLimitException) {
        return res.status(422).json({
            response: {},
            metaData: {
                message: `${err.message ? err.message : 'Out of limit!'}`,
                code: 422,
                response_code: "0001",
            },
        });
    }

    if (err instanceof ErrorPreviousStageNotPassed) {
        return res.status(422).json({
            response: {},
            metaData: {
                message: err.message,
                code: 422,
                response_code: "0001",
            },
        });
    }

    if (err instanceof ErrorSyncronization) {
        return res.status(422).json({
            response: {},
            metaData: {
                message: err.message,
                code: 422,
                response_code: "0001",
            },
        });
    }

    console.error(err);
    return res.status(500).json({
        response: {},
        metaData: {
            message: "Ops, " + err.message,
            code: 500,
            response_code: "0001",
        },
    });
};

module.exports = {
    urlValidation,
    handleErrors
};
