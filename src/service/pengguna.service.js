// library
const { v7: uuidv7 } = require('uuid');

// exception
const ErrorNotFoundException = require('../../exception/error-not-found.exception').ErrorNotFoundException;
const ErrorQueryException = require("../../exception/error-query.exception").ErrorQueryException;

// utility
const { getMetadataInfo } = require('../../utility/metadata-info.utility'); 
const EncryptDecryptClass = require("../../utility/encrypt-decrypt");
const encryptDecrypt = new EncryptDecryptClass();

// db
const db = require('../../database/mysql.connection'); 

// repo
const penggunaRepo = require('../repository/pengguna.repository');

// create
const createPengguna = async (req) => {
    const transaction = await db.sequelize.transaction();

    try {
        const body = req.body;
        const transaction = await db.sequelize.transaction(); 
        const { currentDatetime, penggunaId } = getMetadataInfo(req);

        // const pengguna = await penggunaRepo.getPenggunaById(penggunaId);
        // if (!pengguna) {
        //     throw new ErrorNotFoundException('Pengguna tidak ditemukan');
        // }

        if (!body.password) {
            throw new ErrorQueryException('Password harus diisi');
        }

        const hashedPassword = encryptDecrypt.encryptBcrypt(body.password);

        const payload = {
            id_pengguna: uuidv7(),
            nama: body.nama,
            id_jabatan: body.id_jabatan,
            email: body.email,
            telepon: body.telepon,
            password: hashedPassword,
            // nama_file: body.nama_file,
            // label_file: body.label_file,
            status_pengguna: body.status_pengguna || 1,
            created_at: currentDatetime,
            updated_at: currentDatetime,
        };

        const newPengguna = await penggunaRepo.createPengguna(payload, transaction);
        await transaction.commit();
        
        const response = { ...newPengguna.get({ plain: true }) };
        delete response.password;
        
        return response;
    } catch (error) {
        await transaction.rollback();
        throw error;
    };
};

// get all pengguna
const getAllPengguna = async (req) => {
    try {
        const { currentDatetime, penggunaId, jabatanId, level } = getMetadataInfo(req);
        
        // Pagination parameters
        const pageNumber = parseInt(req.query.number) || 1;
        const pageSize = parseInt(req.query.size) || 10;
        
        // Filter parameters
        const filter = {
            search: req.query.search || null,
            jabatan: req.query.jabatan || null,
            status_pengguna: req.query.status_pengguna !== undefined ? 
                parseInt(req.query.status_pengguna) : undefined
        };

        const options = {
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize
        };

        // Get data
        const penggunaList = await penggunaRepo.getAllPengguna(options, filter, level, penggunaId);
        const totalData = await penggunaRepo.countPengguna(filter, level, penggunaId);

        // Format response
        const formattedData = penggunaList.map(pengguna => {
            return {
                id_pengguna: pengguna.id_pengguna,
                nama: pengguna.nama,
                email: pengguna.email,
                telepon: pengguna.telepon,
                jabatan: pengguna.jabatan?.jabatan,
                divisi: pengguna.jabatan?.divisi,
                level: pengguna.jabatan?.level,
                status_pengguna: pengguna.status_pengguna
            };
        });

        return {
            page: {
                total_record_count: totalData,
                batch_number: pageNumber,
                batch_size: formattedData.length,
                max_batch_size: pageSize
            },
            records: formattedData
        };
    } catch (err) {
        console.error(err);
        throw new ErrorQueryException('Gagal mengambil data pengguna');
    }
};

// get pengguna by id
const getPenggunaById = async (req) => {
    const penggunaId = req.params.id_pengguna; 

    const penggunaData = await penggunaRepo.getPenggunaById(penggunaId);

    if (!penggunaData) {
        throw new ErrorNotFoundException(`Pengguna dengan ID ${penggunaId} tidak ditemukan.`);
    }

    // if (penggunaData.status_pengguna === 0) {
    //     throw new ErrorNotFoundException('Pengguna tidak aktif');
    // }

    const formattedData = {
        id_pengguna: penggunaData.id_pengguna,
        nama: penggunaData.nama,
        email: penggunaData.email,
        telepon: penggunaData.telepon,
        id_jabatan: penggunaData.id_jabatan,
        jabatan: penggunaData.jabatan?.jabatan,
        divisi: penggunaData.jabatan?.divisi,
        level: penggunaData.jabatan?.level,
        status_pengguna: penggunaData.status_pengguna,
        created_at: penggunaData.created_at,
        updated_at: penggunaData.updated_at
    };

    return formattedData;
};

// update pengguna
const updatePengguna = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const penggunaId = req.params.id_pengguna;
        const body = req.body;
        const { currentDatetime } = getMetadataInfo(req);

        // Validation
        // if (body.status_pengguna !== undefined) {
        //     throw new ErrorQueryException('Gunakan endpoint soft delete untuk mengubah status');
        // }

        const payload = {
            nama: body.nama,
            email: body.email,
            telepon: body.telepon,
            id_jabatan: body.id_jabatan,
            updated_at: currentDatetime
        };

        // Clean payload
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        const updatedData = await penggunaRepo.updatePengguna(penggunaId, payload, transaction);
        
        if (!updatedData) {
            throw new ErrorNotFoundException(`Pengguna dengan ID ${penggunaId} tidak ditemukan`);
        }

        const formattedData = {
            id_pengguna: updatedData.id_pengguna,
            nama: updatedData.nama,
            email: updatedData.email,
            telepon: updatedData.telepon,
            jabatan: updatedData.jabatan?.jabatan,
            divisi: updatedData.jabatan?.divisi,
            level: updatedData.jabatan?.level
        };

        await transaction.commit();
        return formattedData;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// soft delete pengguna
const softDeletePengguna = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const penggunaId = req.params.id_pengguna;
        
        const isSuccess = await penggunaRepo.softDeletePengguna(penggunaId, transaction);
        
        if (!isSuccess) {
            throw new ErrorNotFoundException(`Pengguna dengan ID ${penggunaId} tidak ditemukan`);
        }

        await transaction.commit();
        return { message: 'Pengguna berhasil dinonaktifkan' };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// export module
module.exports = {
    createPengguna,
    getAllPengguna,
    getPenggunaById,
    updatePengguna,
    softDeletePengguna
};