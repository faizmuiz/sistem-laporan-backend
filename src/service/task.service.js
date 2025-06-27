// library
const { v7: uuidv7 } = require('uuid');

// exception
const ErrorNotFoundException = require('../../exception/error-not-found.exception').ErrorNotFoundException;
const ErrorQueryException = require("../../exception/error-query.exception").ErrorQueryException;

// utility
const { getMetadataInfo } = require('../../utility/metadata-info.utility'); 

// db
const db = require('../../database/mysql.connection'); 

// repo
const taskRepo = require('../repository/task.repository');

// get all
const getTasks = async (req) => {
    try {
        // Pagination parameters
        const pageNumber = parseInt(req.query.number) || 1;
        const pageSize = parseInt(req.query.size) || 10;
        
        // Filter parameters
        const filters = {
            id_target: req.query.id_target || null,
            id_projek: req.query.id_projek || null,
            id_laporan: req.query.id_laporan || null,
            status_task: req.query.status_task !== undefined ? 
                parseInt(req.query.status_task) : undefined,
            status_selesai: req.query.status_selesai
                ? req.query.status_selesai.split(',').map(Number)
                : undefined
        };

        const options = {
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize
        };

        // Get data
        const tasks = await taskRepo.getTasks(filters, options);
        
        // Get total count for pagination
        const totalData = await taskRepo.countTasks(filters);

        // Format response
        const formattedData = tasks.map(task => ({
            id_task: task.id_task,
            task: task.task,
            status_task: task.status_task,
            status_selesai: task.status_selesai,
            bobot: task.bobot, 
            deadline: task.deadline,
            created_at: task.created_at,
            updated_at: task.updated_at,
            projek: task.projek ? {
                id_projek: task.projek.id_projek,
                projek: task.projek.projek
            } : null,
            pengguna: task.pengguna ? {
                id_pengguna: task.pengguna.id_pengguna,
                nama: task.pengguna.nama
            } : null,
            laporan_harian: task.laporan_harian ? {
                id_laporan: task.laporan_harian.id_laporan,
                judul: task.laporan_harian.judul
            } : null
        }));

        return {
            page: {
                total_record_count: totalData,
                batch_number: pageNumber,
                batch_size: formattedData.length,
                max_batch_size: pageSize
            },
            records: formattedData
        };
    } catch (error) {
        if (error instanceof ErrorQueryException) {
            throw error;
        }
        throw new ErrorQueryException('Gagal mendapatkan daftar task');
    }
};

// create task (by PM)
const bulkCreateTasks = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const body = req.body; 
        const { currentDatetime, penggunaId } = getMetadataInfo(req);

        if (!Array.isArray(body)) {
            throw new ErrorQueryException('Input should be an array of tasks');
        }

        const tasks = body.map(taskData => ({
            id_task: uuidv7(),
            id_projek: taskData.id_projek,
            id_target: taskData.id_target,
            task: taskData.task,
            status_task: taskData.status_task || 1,
            bobot: taskData.bobot || null,  
            deadline: taskData.deadline || null,  
            created_at: currentDatetime,
            updated_at: currentDatetime,
            id_laporan: null,
            status_selesai: 0
        }));

        const createdTasks = await taskRepo.bulkCreateTasks(tasks, transaction);
        await transaction.commit();
        
        return createdTasks.map(task => ({
            id_task: task.id_task,
            id_projek: task.id_projek,
            id_target: task.id_target,
            task: task.task,
            status_task: task.status_task,
            status_selesai: task.status_selesai,
            bobot: task.bobot,
            deadline: task.deadline,
            created_at: task.created_at,
            updated_at: task.updated_at
        }));
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// update task (by target user - update id_laporan and status_selesai)
const bulkUpdateTasks = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const body = req.body;
        const { currentDatetime, penggunaId } = getMetadataInfo(req);

        if (!Array.isArray(body)) {
            throw new ErrorQueryException('Input should be an array of tasks');
        }

        // Verify all tasks belong to the user
        // const taskIds = body.map(t => t.id_task);
        // const existingTasks = await task.findAll({
        //     where: { id_task: taskIds },
        //     attributes: ['id_task', 'id_target']
        // });

        // const invalidTasks = existingTasks.filter(t => t.id_target !== penggunaId);
        // if (invalidTasks.length > 0) {
        //     throw new ErrorQueryException('Some tasks are not assigned to you');
        // }

        const updates = body.map(taskData => ({
            id_task: taskData.id_task,
            payload: {
                id_laporan: taskData.id_laporan || null,
                status_selesai: taskData.status_selesai || 1,
                updated_at: currentDatetime
            }
        }));

        const updateResults = await taskRepo.bulkUpdateTasks(updates, transaction);
        await transaction.commit();

        return updateResults;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Update task target and description
const updateTask = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const id_task = req.params.id_task;
        const body = req.body;
        const { currentDatetime } = getMetadataInfo(req);

        // Validasi input lebih ketat
        if (!body.id_target || typeof body.task !== 'string') {
            throw new ErrorQueryException('id_target harus valid UUID dan task harus string');
        }

        const payload = {
            id_target: body.id_target,
            task: body.task,
            bobot: body.bobot || null,  
            deadline: body.deadline || null,
            updated_at: currentDatetime
        };

        // Cek dulu apakah task ada sebelum update
        // const existingTask = await task.findOne({
        //     where: { id_task },
        //     transaction
        // });

        // if (!existingTask) {
        //     throw new ErrorNotFoundException('Task tidak ditemukan');
        // }

        const updatedTask = await taskRepo.updateTask(
            id_task, 
            payload, 
            transaction
        );

        if (!updatedTask) {
            throw new ErrorQueryException('Gagal mengupdate task');
        }

        // Dapatkan data lengkap setelah update
        // const fullTaskData = await task.findOne({
        //     where: { id_task },
        //     include: [
        //         {
        //             model: projek,
        //             as: 'projek',
        //             attributes: ['id_projek', 'projek']
        //         },
        //         {
        //             model: pengguna,
        //             as: 'pengguna',
        //             attributes: ['id_pengguna', 'nama']
        //         }
        //     ],
        //     transaction
        // });

        // Format response
        const formattedData = {
            id_task: updatedTask.id_task,
            task: updatedTask.task,
            status_task: updatedTask.status_task,
            status_selesai: updatedTask.status_selesai,
            bobot: updatedTask.bobot,  
            deadline: updatedTask.deadline, 
            updated_at: updatedTask.updated_at,
            // projek: fullTaskData.projek ? {
            //     id_projek: fullTaskData.projek.id_projek,
            //     projek: fullTaskData.projek.projek
            // } : null,
            // target_user: fullTaskData.pengguna ? {
            //     id_pengguna: fullTaskData.pengguna.id_pengguna,
            //     nama: fullTaskData.pengguna.nama
            // } : null
        };

        await transaction.commit();
        return formattedData;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// soft delete task
const softDeleteTask = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const id_task = req.params.id_task;

        const updatedTask = await taskRepo.softDeleteTask(id_task, transaction);
        
        if (!updatedTask) {
            throw new ErrorQueryException('Gagal menghapus task');
        }

        await transaction.commit();
        return { message: 'Task berhasil dihapus' };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = {
    getTasks,
    bulkCreateTasks,
    bulkUpdateTasks,
    updateTask,
    softDeleteTask
};