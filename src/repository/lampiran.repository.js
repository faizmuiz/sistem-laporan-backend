// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

// model
const db = require('../../database/mysql.connection');
const lampiran = db.lampiran;

// create
const createLampiran = async (payload, transaction = null) => {
    try {
        const config = {transaction};
        return await lampiran.create(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// get lampiran by laporan id
const getLampiranByLaporanId = async (laporanId) => {
    try {
        return await lampiran.findAll({
            where: {id_laporan: laporanId},
            order : [['created_at', 'ASC']]
        });
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
        
    }
};

// get lampiran by id
const getLampiranById = async (lampiranId) => {
    try {
        return await lampiran.findOne({
            where: {id_lampiran: lampiranId}
        });
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
        
    }
};

// delete lampiran by id
const deleteLampiranById = async (lampiranId) => {
    try {
        const result = await lampiran.destroy({
            where: {id_lampiran: lampiranId}
        });
        return result;  
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
        
    }
};

// export module
module.exports = {
    createLampiran,
    getLampiranByLaporanId,
    getLampiranById,
    deleteLampiranById
};