// library
const { Op } = require('sequelize');

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

// model
const db = require('../../database/mysql.connection');
const jabatan = db.jabatan                                                                                                                                  ;

// create
const createJabatan = async (payload, transaction = null) => {
    try {
        const config = {transaction};
        return await jabatan.create(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    };
}; 

// get jabatan by id
const getJabatanById = async (jabatanId) => {
    try {
        const jabatanData = await jabatan.findOne({
            where: { id_jabatan: jabatanId },
        });

        return jabatanData;
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    };
};

// get all jabatan 
const getAllJabatan = async (options = {}, filter = {}) => {
    try {
        const { search, parent } = filter;
        
        const config = {
            include: [
                {
                    model: jabatan,
                    as: 'parent_jabatan',
                    attributes: ['jabatan'],
                }
            ],
            order: [
                ['level', 'ASC'] 
            ],
            ...options,
            where: {} 
        };

        // Filter by parent
        if (parent) {
            config.where.parent = parent;
        }

        // Search filter
        if (search) {
            config.where[Op.or] = [
                { jabatan: { [Op.like]: `%${search}%` } },
                { divisi: { [Op.like]: `%${search}%` } },
                { '$parent_jabatan.jabatan$': { [Op.like]: `%${search}%` } }
            ];
        }

        const result = await jabatan.findAll(config);
        return result;
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// count jabatan
const countJabatan = async (filter = {}) => {
    try {
        const { search, parent } = filter;
        
        const where = {};

        // Filter by parent if provided
        if (parent) {
            where.parent = parent;
        }

        // Search filter
        if (search) {
            where[Op.or] = [
                { jabatan: { [Op.like]: `%${search}%` } },
                { divisi: { [Op.like]: `%${search}%` } },
                { '$parent_jabatan.jabatan$': { [Op.like]: `%${search}%` } }
            ];
        }

        const include = [{
            model: jabatan,
            as: 'parent_jabatan',
            attributes: []
        }];

        return await jabatan.count({
            where,
            include
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// update jabatan
const updateJabatan = async (id_jabatan, payload, transaction = null) => {
    try {
        const config = {
            where: { id_jabatan },
            transaction
        };

        const updated = await jabatan.update(payload, config);

        if (updated[0] > 0) {  
            return await jabatan.findOne({
                where: { id_jabatan },
                transaction
            });
        }

        return null;
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

// export module
module.exports = {
    createJabatan,
    getJabatanById,
    getAllJabatan,
    countJabatan,
    updateJabatan
};
