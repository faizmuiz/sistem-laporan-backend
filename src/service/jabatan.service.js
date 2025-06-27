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
const jabatanRepo = require('../repository/jabatan.repository');

// create
const createJabatan = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const body = req.body;
        const { currentDatetime } = getMetadataInfo(req);

        const payload = {
            id_jabatan: uuidv7(),
            jabatan: body.jabatan,
            divisi: body.divisi,
            parent: body.parent || null,
            level: body.level || null, 
            created_at: currentDatetime,
            updated_at: currentDatetime,
        };

        const newJabatan = await jabatanRepo.createJabatan(payload, transaction);
        await transaction.commit();
        return newJabatan;
    } catch (error) {
        await transaction.rollback();
        throw error;
    };
};

// get jabatan by id
const getJabatanById = async (req) => {
    const jabatanId = req.params.id_jabatan; 

    //harusnya ada validation harus di isi

    const jabatan = await jabatanRepo.getJabatanById(jabatanId);

    if (!jabatan) {
        throw new ErrorNotFoundException(`Jabatan dengan ID ${jabatanId} tidak ditemukan.`);
    }

    return jabatan;
};

// get all
const getAllJabatan = async (req) => {
    try {
        // Pagination parameters
        const pageNumber = parseInt(req.query.number) || 1;
        const pageSize = parseInt(req.query.size) || 20;
        
        // Filter parameters
        const filter = {
            search: req.query.search || null,
            parent: req.query.parent || null
        };

        const options = {
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize
        };

        // Get data
        const jabatanList = await jabatanRepo.getAllJabatan(options, filter);
        const totalData = await jabatanRepo.countJabatan(filter);

        // Format response
        const formattedData = jabatanList.map(item => {
            const plain = item.get({ plain: true });
            return {
                id_jabatan: plain.id_jabatan,
                jabatan: plain.jabatan,
                divisi: plain.divisi,
                parent: plain.parent,
                parent_jabatan: plain.parent_jabatan?.jabatan || null,
                level: plain.level,
                created_at: plain.created_at,
                updated_at: plain.updated_at
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
        throw new ErrorQueryException('Gagal mengambil data jabatan');
    }
};

// update jabatan
const updateJabatan = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const idJabatan = req.params.id_jabatan;
        const body = req.body;
        const { currentDatetime, level: userLevel } = getMetadataInfo(req);

        // Hanya super admin (level 0) yang bisa mengupdate jabatan
        if (userLevel !== 0) {
            throw new ErrorNotFoundException('Hanya Super Admin yang dapat mengupdate jabatan');
        }

        // Ambil data jabatan yang akan diupdate
        const existingJabatan = await jabatanRepo.getJabatanById(idJabatan, transaction);
        if (!existingJabatan) {
            throw new ErrorNotFoundException(`Jabatan dengan ID ${idJabatan} tidak ditemukan`);
        }

        // Validasi parent jika diubah
        let newParentLevel = null;
        if (body.parent && body.parent !== existingJabatan.parent) {
            const parentJabatan = await jabatanRepo.getJabatanById(body.parent, transaction);
            if (!parentJabatan) {
                throw new ErrorNotFoundException('Parent jabatan tidak ditemukan');
            }
            newParentLevel = parentJabatan.level;
        }

        // Tentukan level baru
        let newLevel = existingJabatan.level;
        if (body.level !== undefined) {
            // Validasi level manual
            if (typeof body.level !== 'number' || body.level < 1) {
                throw new ErrorNotFoundException('Level jabatan harus angka dan minimal 1');
            }
            
            // Jika mengubah level ke 4 (karyawan), pastikan parent level <= 3
            if (body.level === 4 && newParentLevel && newParentLevel > 3) {
                throw new ErrorNotFoundException('Parent jabatan untuk level 4 maksimal level 3');
            }
            
            newLevel = body.level;
        } else if (newParentLevel !== null) {
            // Jika tidak ada override level, hitung berdasarkan parent
            newLevel = newParentLevel + 1;
        }

        const payload = {
            jabatan: body.jabatan || existingJabatan.jabatan,
            divisi: body.divisi || existingJabatan.divisi,
            parent: body.parent || existingJabatan.parent,
            level: newLevel, 
            updated_at: currentDatetime
        };

        const updatedData = await jabatanRepo.updateJabatan(idJabatan, payload, transaction);

        if (!updatedData) {
            throw new ErrorNotFoundException(`Gagal mengupdate jabatan dengan ID ${idJabatan}`);
        }

        await transaction.commit();
        
        return {
            id_jabatan: updatedData.id_jabatan,
            jabatan: updatedData.jabatan,
            divisi: updatedData.divisi,
            parent: updatedData.parent,
            level: updatedData.level
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// export module
module.exports = {
    createJabatan,
    getJabatanById,
    getAllJabatan,
    updateJabatan
};