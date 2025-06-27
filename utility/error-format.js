const sequelizeDB = async (error) => {
    console.log("error handle query : ", error);
    // console.log("error handle query : ", error.original.errno);
    // console.log("error handle query : ", error.name);
    let response = {
        data: [],
        metaData: {
            message: error.message,
            code: 500,
            response_code: "0001",
        },
    };

    if ( error.name && error.name == 'SequelizeForeignKeyConstraintError' && error.original.errno == 1452 ) { //mysql code error foreigen key 1452
        response.metaData.message = "foreign key constraint fails";
        response.metaData.code = 422;
        response.metaData.response_code = "5542";
    }

    if (error.errors) {
        let newError = await error.errors.map((e) => {
            const err = {};
            err.field = e.path;
            err.message = e.type == "unique violation" ? "Data sudah diinputkan" : e.message;
            return err;
        });

        response.data = [...response.data, ...newError];
        response.metaData.code = 422;
        response.metaData.response_code = "5574";
    }

    return response;
};

module.exports = {
    sequelizeDB,
};
