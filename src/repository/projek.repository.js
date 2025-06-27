// library
const { Op } = require('sequelize');

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

// model
const db = require('../../database/mysql.connection');
const projek = db.projek;
const pengguna = db.pengguna;
const jabatan = db.jabatan;

// get projek 
const getAllProjek = async (options = {}, filter = {}, level, penggunaId) => {
    try {
        const { search, status_projek } = filter;
        
        const config = {
            include: [{
                model: pengguna,
                as: 'pengguna',
                attributes: ['id_pengguna', 'nama'],
                include: [{
                    model: jabatan,
                    as: 'jabatan',
                    attributes: ['jabatan']
                }]
            }],
            attributes: ['id_projek', 'projek', 'status_projek', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']],
            ...options
        };

        // Add status filter if provided
        if (status_projek !== undefined) {
            config.where = {
                ...config.where,
                status_projek: status_projek
            };
        }

        // Filter based on user level
        if (level === 2 || level === 3) {
            // Atasan can only see their own projects
            config.where = {
                ...config.where,
                id_pengguna: penggunaId
            };
        } else if (level >= 4) {
            // Karyawan can see projects from their atasan
            // First get the karyawan's jabatan
            const karyawan = await pengguna.findOne({
                where: { id_pengguna: penggunaId },
                include: [{
                    model: jabatan,
                    as: 'jabatan',
                    attributes: ['id_jabatan', 'parent']
                }]
            });

            if (!karyawan || !karyawan.jabatan) {
                throw new ErrorQueryException('Data jabatan karyawan tidak ditemukan');
            }

            // Find the atasan's pengguna ID
            const atasanPengguna = await pengguna.findOne({
                where: { id_jabatan: karyawan.jabatan.parent },
                attributes: ['id_pengguna']
            });

            if (!atasanPengguna) {
                throw new ErrorQueryException('Data atasan tidak ditemukan');
            }

            config.where = {
                ...config.where,
                id_pengguna: atasanPengguna.id_pengguna
            };
        }

        // Search filter
        if (search) {
            config.where = {
                ...config.where,
                [Op.or]: [
                    { projek: { [Op.like]: `%${search}%` } },
                    { '$pengguna.nama$': { [Op.like]: `%${search}%` } }
                ]
            };
        }

        return await projek.findAll(config);
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// count
const countProjek = async (filter = {}, level, penggunaId) => {
    try {
        const { search, status_projek } = filter;
        
        const where = {};

        // Add status filter if provided
        if (status_projek !== undefined) {
            where.status_projek = status_projek;
        }

        // Filter based on user level
        if (level === 2 || level === 3) {
            // Atasan can only see their own projects
            where.id_pengguna = penggunaId;
        } else if (level >= 4) {
            // Karyawan can see projects from their atasan
            const karyawan = await pengguna.findOne({
                where: { id_pengguna: penggunaId },
                include: [{
                    model: jabatan,
                    as: 'jabatan',
                    attributes: ['id_jabatan', 'parent']
                }]
            });

            if (!karyawan || !karyawan.jabatan) {
                throw new ErrorQueryException('Data jabatan karyawan tidak ditemukan');
            }

            const atasanPengguna = await pengguna.findOne({
                where: { id_jabatan: karyawan.jabatan.parent },
                attributes: ['id_pengguna']
            });

            if (!atasanPengguna) {
                throw new ErrorQueryException('Data atasan tidak ditemukan');
            }

            where.id_pengguna = atasanPengguna.id_pengguna;
        }

        // Search filter
        if (search) {
            where[Op.or] = [
                { projek: { [Op.like]: `%${search}%` } },
                { '$pengguna.nama$': { [Op.like]: `%${search}%` } }
            ];
        }

        const include = [{
            model: pengguna,
            as: 'pengguna',
            attributes: [],
            include: [{
                model: jabatan,
                as: 'jabatan',
                attributes: []
            }]
        }];

        return await projek.count({
            where,
            include
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// create projek
const createProjek = async (payload, transaction = null) => {
    try {
        const config = {transaction};
        return await projek.create(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
}

// update projek
const updateProjek = async (id_projek, payload, transaction = null) => {
    try {
        const config = {
            where: {id_projek},
            transaction
        };

        const [updated] = await projek.update (payload, config);

        if (updated > 0) {
            return await projek.findOne({
                where: {id_projek},
                transaction
            });
        }

        return null;
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
}

// soft delete projek
const softDeleteProjek = async (id_projek, transaction = null) => {
    try {
        const config = {
            where: {id_projek},
            transaction
        };

        const [updated] = await projek.update(
            {status_projek:0, updated_at: new Date()},
            config
        );

        return updated > 0
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
}

module.exports = {
    getAllProjek,
    countProjek,
    createProjek,
    updateProjek,
    softDeleteProjek
};