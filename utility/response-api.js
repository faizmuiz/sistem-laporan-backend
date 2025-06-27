module.exports = (metaData = {} , data = []) => {
    const {code = 500, message = "Ok", res_code = "0001"} = metaData;

    let response = {}; 
    if (code == 200) {
        response = {
            response: data,
            metaData: {
                message: message,
                code: code,
                response_code: "0000",
            }
        }   
    } else {
        response = {
            response: data,
            metaData: {
                message: message,
                code: code,
                response_code: res_code,
            }
        }
    }

    return response;
};
