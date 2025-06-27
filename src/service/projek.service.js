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
const projekRepo = require('../repository/projek.repository');

// get all
const getAllProjek = async (req) => {
    try {
        const { penggunaId, level } = getMetadataInfo(req);
        
        // Pagination parameters
        const pageNumber = parseInt(req.query.number) || 1;
        const pageSize = parseInt(req.query.size) || 10;
        
        // Filter parameters
        const filter = {
            search: req.query.search || null,
            status_projek: req.query.status_projek !== undefined ? 
                parseInt(req.query.status_projek) : undefined
        };

        const options = {
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize
        };

        // Get data
        const projekList = await projekRepo.getAllProjek(options, filter, level, penggunaId);
        
        if (!projekList || projekList.length === 0) {
            throw new ErrorNotFoundException('Daftar projek tidak ditemukan');
        }

        // Get total count for pagination
        const totalData = await projekRepo.countProjek(filter, level, penggunaId);

        // Format response
        const formattedData = projekList.map(projek => ({
            id_projek: projek.id_projek,
            projek: projek.projek,
            status_projek: projek.status_projek,
            pengguna: {
                id_pengguna: projek.pengguna?.id_pengguna,
                nama: projek.pengguna?.nama,
                jabatan: projek.pengguna?.jabatan?.jabatan
            },
            created_at: projek.created_at,
            updated_at: projek.updated_at
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
        if (error instanceof ErrorNotFoundException || error instanceof ErrorQueryException) {
            throw error;
        }
        console.error(error);
        throw new ErrorQueryException('Gagal mendapatkan daftar projek');
    }
};

// create projek
const createProjek = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const body = req.body;
        const { currentDatetime, penggunaId } = getMetadataInfo(req);

        const payload = {
            id_projek: uuidv7(),
            projek: body.projek,
            id_pengguna: penggunaId,
            created_at: currentDatetime,
            updated_at: currentDatetime,
            status_projek: body.status_projek || 1,
        }

        const newProjek = await projekRepo.createProjek(payload, transaction);
        await transaction.commit();
        return newProjek
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// update projek
const updateProjek = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const idProjek = req.params.id_projek;
        const body = req.body
        const { currentDatetime, penggunaId } = getMetadataInfo(req);

        const payload = {
            projek: body.projek,
            updated_at: currentDatetime,
        }

        const updatedData = await projekRepo.updateProjek(idProjek, payload, transaction);

        if (!updatedData) {
            throw new ErrorNotFoundException(`Projek tidak ditemukan`); 
        }

        const formattedData = {
            id_projek: updatedData.id_projek,
            projek: updatedData.projek,
            status_projek: updatedData.status_projek
        };

        await transaction.commit();
        return formattedData;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// soft delete projek
const softDeleteProjek = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const projekId = req.params.id_projek;
        
        const isSuccess = await projekRepo.softDeleteProjek(projekId, transaction);

        if (!isSuccess) {
            throw new ErrorNotFoundException(`Projek tidak ditemukan`);
        }

        await transaction.commit();
        return { message: 'Projek berhasil dinonaktifkan' };
    } catch (error) {
        
    }
}

module.exports = {
    getAllProjek,
    createProjek,
    updateProjek,
    softDeleteProjek
}