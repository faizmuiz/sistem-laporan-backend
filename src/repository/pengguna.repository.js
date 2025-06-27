// library
const { Op } = require('sequelize');

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

// model
const db = require('../../database/mysql.connection');
const pengguna = db.pengguna;
const jabatan = db.jabatan;

// create
const createPengguna = async (payload, transaction = null) => {
    try {
        const config = {transaction};
        return await pengguna.create(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// get all pengguna
const getAllPengguna = async (options = {}, filter = {}, level, penggunaId) => {
    try {
        const { search, jabatan: id_jabatan, status_pengguna } = filter;
        
        const config = {
            include: [{
                model: jabatan,
                as: 'jabatan',
                attributes: ['jabatan', 'divisi', 'level']
            }],
            attributes: ['id_pengguna', 'nama', 'email', 'telepon', 'status_pengguna'],
            ...options,
            where: {} 
        };

        // Filter by status_pengguna
        if (status_pengguna !== undefined) {
            config.where.status_pengguna = status_pengguna;
        }

        // Filter untuk level atasan (level 2/3)
        if (level === 2 || level === 3) {
            const atasan = await pengguna.findOne({
                where: { id_pengguna: penggunaId },
                include: [{
                    model: jabatan,
                    as: 'jabatan',
                    attributes: ['id_jabatan']
                }]
            });

            if (!atasan || !atasan.jabatan) {
                throw new ErrorQueryException('Data jabatan atasan tidak ditemukan');
            }

            const atasanJabatanId = atasan.jabatan.id_jabatan;

            const subordinateJabatans = await jabatan.findAll({
                where: { parent: atasanJabatanId },
                attributes: ['id_jabatan']
            });

            const subordinateJabatanIds = subordinateJabatans.map(j => j.id_jabatan);

            config.where.id_jabatan = subordinateJabatanIds;
        }

        // Filter by id_jabatan jika disediakan
        if (id_jabatan) {
            config.where.id_jabatan = id_jabatan;
        }

        // Search filter
        if (search) {
            config.where[Op.or] = [
                { nama: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { '$jabatan.jabatan$': { [Op.like]: `%${search}%` } }
            ];
        }

        const result = await pengguna.findAll(config);
        return result;
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// count
const countPengguna = async (filter = {}, level, penggunaId) => {
    try {
        const { search, jabatan: id_jabatan, status_pengguna } = filter;
        
        const where = {};

        // Add status filter if provided
        if (status_pengguna !== undefined) {
            where.status_pengguna = status_pengguna;
        } 
        // else {
        //     // Default to active users only if status not specified
        //     where.status_pengguna = 1;
        // }

        // Filter for atasan (level 2 or 3)
        if (level === 2 || level === 3) {
            // Get the atasan's jabatan
            const atasan = await pengguna.findOne({
                where: { id_pengguna: penggunaId },
                include: [{
                    model: jabatan,
                    as: 'jabatan',
                    attributes: ['id_jabatan']
                }]
            });

            if (!atasan || !atasan.jabatan) {
                throw new ErrorQueryException('Data jabatan atasan tidak ditemukan');
            }

            const atasanJabatanId = atasan.jabatan.id_jabatan;

            // Find all jabatan that have this atasan as parent
            const subordinateJabatans = await jabatan.findAll({
                where: { parent: atasanJabatanId },
                attributes: ['id_jabatan']
            });

            const subordinateJabatanIds = subordinateJabatans.map(j => j.id_jabatan);

            // Add filter to only count pengguna with these jabatan ids
            where.id_jabatan = subordinateJabatanIds;
        }

        // Filter by jabatan if provided
        if (id_jabatan) {
            where.id_jabatan = id_jabatan;
        }

        // Search filter
        if (search) {
            where[Op.or] = [
                { nama: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { '$jabatan.jabatan$': { [Op.like]: `%${search}%` } }
            ];
        }

        const include = [{
            model: jabatan,
            as: 'jabatan',
            attributes: []
        }];

        return await pengguna.count({
            where,
            include
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// get pengguna by id
const getPenggunaById = async (penggunaId) => {
    try {
        const penggunaData = await pengguna.findOne({
            where: { id_pengguna: penggunaId },
            include: [{
                model: jabatan,
                as: 'jabatan', 
                attributes: ['jabatan', 'divisi', 'level']
            }],
            // attributes: ['id_pengguna', 'nama', 'email', 'telepon', 'status_pengguna']
        });

        // console.log('Data pengguna:', penggunaData); 
        return penggunaData;
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// update pengguns
const updatePengguna = async (id_pengguna, payload, transaction = null) => {
    try {
        const config = { 
            where: { id_pengguna },
            transaction
            // returning: true,
            // individualHooks: true
        };
        const [updated] = await pengguna.update(payload, config);
        if (updated > 0) {
            return await pengguna.findOne({
                where: { id_pengguna },
                include: [{
                    model: jabatan,
                    as: 'jabatan'
                }],
                transaction
            });
        }
        return null;
        // return await pengguna.update(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

// soft delete pengguna
const softDeletePengguna = async (id_pengguna, transaction = null) => {
    try {
        const config = {
            where: { id_pengguna },
            transaction
            // returning: true
        };
        const [updated] = await pengguna.update(
            { status_pengguna: 0, updated_at: new Date() },
            config
        );
        return updated > 0;
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

// export module
module.exports = {
    createPengguna,
    getAllPengguna,
    countPengguna,
    getPenggunaById,
    updatePengguna,
    softDeletePengguna
};