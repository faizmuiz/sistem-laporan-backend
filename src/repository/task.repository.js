// library
const { Op } = require('sequelize');

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

// model
const db = require('../../database/mysql.connection');
const task = db.task;
const projek = db.projek;
const pengguna = db.pengguna;
const laporanHarian = db.laporan_harian;

// get all
const getTasks = async (filters = {}, options = {}) => {
    try {
        const { id_target, id_projek, id_laporan, status_task, status_selesai } = filters;
        
        const config = {
            include: [
                {
                    model: projek,
                    as: 'projek',
                    attributes: ['id_projek', 'projek']
                },
                {
                    model: pengguna,
                    as: 'pengguna',
                    attributes: ['id_pengguna', 'nama']
                },
                {
                    model: laporanHarian,
                    as: 'laporan_harian',
                    attributes: ['id_laporan', 'judul']
                }
            ],
            order: [['created_at', 'DESC']],
            where: {},
            ...options
        };

        // Apply filters
        if (id_target) config.where.id_target = id_target;
        if (id_projek) config.where.id_projek = id_projek;
        if (id_laporan) config.where.id_laporan = id_laporan;
        if (status_task !== undefined) config.where.status_task = status_task;
        if (status_selesai !== undefined) {
            config.where.status_selesai = Array.isArray(status_selesai)
                ? { [Op.in]: status_selesai }
                : status_selesai;
        }

        return await task.findAll(config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

// count tasks
const countTasks = async (filters = {}) => {
    try {
        const { id_target, id_projek, id_laporan, status_task, status_selesai } = filters;
        
        const where = {};

        // Apply filters
        if (id_target) where.id_target = id_target;
        if (id_projek) where.id_projek = id_projek;
        if (id_laporan) where.id_laporan = id_laporan;
        if (status_task !== undefined) where.status_task = status_task;
        if (status_selesai !== undefined) where.status_selesai = status_selesai;

        const include = [
            {
                model: projek,
                as: 'projek',
                attributes: []
            },
            {
                model: pengguna,
                as: 'pengguna',
                attributes: []
            },
            {
                model: laporanHarian,
                as: 'laporan_harian',
                attributes: []
            }
        ];

        return await task.count({
            where,
            include
        });
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

// create task
const bulkCreateTasks = async (tasks, transaction = null) => {
    try {
        const config = { transaction };
        return await task.bulkCreate(tasks, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
}

// update task (for updating id_laporan and status_selesai)
const bulkUpdateTasks = async (taskUpdates, transaction = null) => {
    try {
        const config = { transaction };
        return await Promise.all(
            taskUpdates.map(async (update) => {
                const [affectedCount] = await task.update(update.payload, {
                    where: { id_task: update.id_task },
                    transaction
                });
                return { id_task: update.id_task, affected: affectedCount > 0 };
            })
        );
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
}

// Update task target and description
const updateTask = async (id_task, payload, transaction = null) => {
    try {
        const config = {
            where: { id_task },
            transaction 
        };

        const [updated] = await task.update(payload, config);

        if (updated > 0) {
            return await task.findOne({
                where: { id_task },
                transaction
            });
        }

        return null;
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

const softDeleteTask = async (id_task, transaction = null) => {
    try {
        const config = {
            where: { id_task },
            transaction
        };

        const [updated] = await task.update(
            { status_task: 0, updated_at: new Date() },
            config
        );

        return updated > 0;
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
}

module.exports = {
    getTasks,
    countTasks,
    bulkCreateTasks,
    bulkUpdateTasks,
    updateTask,
    softDeleteTask
};