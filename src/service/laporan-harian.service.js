// library
const { v7: uuidv7 } = require('uuid');
const moment = require('moment');

// exception
const ErrorNotFoundException = require('../../exception/error-not-found.exception').ErrorNotFoundException;
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const { getMetadataInfo } = require('../../utility/metadata-info.utility');

// db
const db = require('../../database/mysql.connection'); 

// repo
const laporanHarianRepo = require('../repository/laporan-harian.repository');
const penggunaRepo = require('../repository/pengguna.repository');

// get all laporan harian
const getAllLaporanHarian = async (req) => {
    try {
        const pageNumber = parseInt(req.query.number) || 1;
        const pageSize = parseInt(req.query.size) || 7;

        const options = {
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize
        };

        const filter = {
            search: req.query.search || null,
            status_laporan: req.query.status_laporan || null,
            tanggal: req.query.tanggal || null,
            sudah_direview: req.query.sudah_direview !== undefined ? parseInt(req.query.sudah_direview) : undefined,
            kendala_selesai: req.query.kendala_selesai !== undefined 
                ? (req.query.kendala_selesai === 'null' ? null : parseInt(req.query.kendala_selesai)) 
                : undefined,
            id_projek: req.query.projek || null,
            id_jabatan: req.query.jabatan || null 
        };

        const { level, penggunaId } = getMetadataInfo(req);

        const data = await laporanHarianRepo.findAll(options, filter, level, penggunaId);
        const totalData = await laporanHarianRepo.count(filter, level, penggunaId);

        return {
            page: {
                total_record_count: totalData,
                batch_number: pageNumber,
                batch_size: data.length,
                max_batch_size: pageSize
            },
            records: data
        };
    } catch (err) {
        console.error(err);
        throw new ErrorQueryException('Gagal mengambil data laporan harian');
    }
};

// get laporan harian by id
const getLaporanById = async (req) => {
    const laporanId = req.params.id_laporan;
    const { penggunaId } = getMetadataInfo(req);

    const data = await laporanHarianRepo.findOne(laporanId, penggunaId);
        
    if (!data) {
        throw new ErrorNotFoundException(`Laporan dengan ID ${laporanId} tidak ditemukan`);
    }

    return data;
};

// create laporan harian dan detail
const createLaporanHarian = async (req) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const body = req.body;
        const { currentDatetime, penggunaId } = getMetadataInfo(req);

        // Validasi kolom
        if (!body.judul) {
            throw new ErrorQueryException('Judul laporan harus diisi');
        }

        // if (!body.id_projek) {
        //     throw new ErrorQueryException('Projek laporan harus diisi');
        // }

        if (!Array.isArray(body.details) || body.details.length === 0) {
            throw new ErrorQueryException('Detail laporan harus diisi');
        }

        // Verifikasi pengguna
        const penggunaData = await penggunaRepo.getPenggunaById(penggunaId);
        if (!penggunaData) {
            throw new ErrorNotFoundException('Pengguna tidak ditemukan');
        }

        // payload laporan harian
        const laporanPayload = {
            id_laporan: uuidv7(),
            id_pengguna: penggunaId,
            id_projek: body.id_projek || null,
            judul: body.judul,
            status_laporan: body.status_laporan || 'draft',
            status: 1, // Aktif
            created_at: body.tanggal ? moment(body.tanggal, 'YYYY-MM-DD').toDate() : currentDatetime, // sediakan dulu input
            updated_at: currentDatetime,
            sudah_direview: body.sudah_direview || 0,
            kendala_selesai: body.details.some(detail => detail.konten === 'kendala') ? 0 : null
        };

        // Create laporan harian
        const laporan = await laporanHarianRepo.createLaporanHarian(laporanPayload, transaction);

        // payload detail laporan harian
        const detailsPayload = body.details.map(detail => ({
            id_harian_detail: uuidv7(),
            id_laporan: laporan.id_laporan,
            konten: detail.konten,
            isi_konten: detail.isi_konten,
            created_at: currentDatetime,
            updated_at: currentDatetime
        }));

        // Create detail laporan harian
        const laporanDetails = await laporanHarianRepo.createLaporanHarianDetail(detailsPayload, transaction);

        await transaction.commit();

        // Format respons
        return {
            laporan: {
                id_laporan: laporan.id_laporan,
                judul: laporan.judul,
                id_projek: laporan.id_projek,
                status_laporan: laporan.status_laporan,
                tanggal: laporan.created_at,
                sudah_direview: laporan.sudah_direview,
                kendala_selesai: laporan.kendala_selesai
            },
            details: laporanDetails.map(detail => ({
                konten: detail.konten,
                isi_konten: detail.isi_konten
            }))
        };

    } catch (error) {
        await transaction.rollback();
        
        if (error instanceof ErrorNotFoundException || error instanceof ErrorQueryException) {
            throw error;
        }
        throw new ErrorQueryException('Gagal membuat laporan harian');
    }
};

// update laporan harian
const updateLaporanHarian = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const laporanId = req.params.id_laporan;
        const body = req.body;
        const { currentDatetime } = getMetadataInfo(req);

        const laporanHarian = await laporanHarianRepo.getLaporanHarianById(laporanId);
        if (!laporanHarian) {
            throw new ErrorNotFoundException('Laporan Harian not found.');
        }

        if (laporanHarian.status_laporan !== 'draft') {
            throw new Error('Laporan cannot be updated because it is not in draft status.');
        }

        // Filter details untuk menghapus yang isi_konten kosong
        const filteredDetails = body.details.filter(detail => 
            detail.isi_konten !== null && detail.isi_konten !== ''
        );

        // Cek apakah ada kendala yang valid (dengan isi_konten tidak kosong)
        const hasKendala = filteredDetails.some(detail => detail.konten === 'kendala');

        // update laporan harian
        const payload = {
            judul: body.judul,
            status_laporan: body.status,
            id_projek: body.id_projek || null,
            updated_at: currentDatetime,
            kendala_selesai: hasKendala ? 0 : null
        };

        await laporanHarianRepo.updateLaporanHarian(laporanId, payload, transaction);

        // update laporan harian detail
        if (Array.isArray(body.details) && body.details.length > 0) {
            const existingDetails = await laporanHarianRepo.getHarainDetailByLaporanId(laporanId);

            // Pertama, hapus detail yang isi_konten kosong
            for (const existingDetail of existingDetails) {
                const shouldKeep = body.details.some(detail => 
                    detail.id_harian_detail === existingDetail.id_harian_detail && 
                    detail.isi_konten !== null && 
                    detail.isi_konten !== ''
                );
                
                if (!shouldKeep) {
                    await laporanHarianRepo.deleteLaporanHarianDetail(
                        existingDetail.id_harian_detail,
                        transaction
                    );
                }
            }

            // Kemudian, proses update atau create untuk detail yang tersisa
            for (const detail of filteredDetails) {
                const isExisting = existingDetails.find(
                    (existing) => existing.id_harian_detail === detail.id_harian_detail
                );

                if (isExisting) {
                    // Update detail yang sudah ada
                    await laporanHarianRepo.updateLaporanHarianDetail(
                        detail.id_harian_detail,
                        {
                            konten: detail.konten,
                            isi_konten: detail.isi_konten,
                            updated_at: currentDatetime,
                        },
                        transaction
                    );
                } else {
                    // Tambah detail baru jika tidak ditemukan yang sesuai
                    await laporanHarianRepo.createSingleLaporanHarianDetail(
                        {
                            id_harian_detail: uuidv7(),
                            id_laporan: laporanId,
                            konten: detail.konten,
                            isi_konten: detail.isi_konten,
                            created_at: currentDatetime,
                            updated_at: currentDatetime,
                        },
                        transaction
                    );
                }
            }
        }

        // commit
        await transaction.commit();

        return {
            message: 'Laporan updated successfully',
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// soft delete laporan harian
const softDeleteLaporanHarian = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const laporanId = req.params.id_laporan;

        // Ambil data laporan dulu
        const laporan = await laporanHarianRepo.getLaporanHarianById(laporanId);

        if (!laporan) {
            throw new ErrorNotFoundException(`Laporan dengan ID ${laporanId} tidak ditemukan`);
        }

        // Cek status_laporan dan status aktif
        if (laporan.status_laporan !== 'draft') {
            throw new ErrorValidationException(`Laporan hanya bisa dihapus jika status_laporan-nya draft`);
        }

        if (laporan.status !== 1) {
            throw new ErrorValidationException(`Laporan sudah tidak aktif atau telah dihapus sebelumnya`);
        }

        const isSuccess = await laporanHarianRepo.softDeleteLaporanHarian(laporanId, transaction);

        if (!isSuccess) {
            throw new ErrorNotFoundException(`Gagal menghapus laporan dengan ID ${laporanId}`);
        }

        await transaction.commit();
        return { message: 'Laporan berhasil dihapus (soft delete)' };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const updateReviewStatus = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const laporanId = req.params.id_laporan;
        const body = req.body;
        const { currentDatetime } = getMetadataInfo(req);

        const payload = {
            sudah_direview: body.sudah_direview,
            // updated_at: currentDatetime
        };

        await laporanHarianRepo.updateReviewStatus(laporanId, payload, transaction);
        await transaction.commit();
        return { message: 'Status review berhasil diperbarui' };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const updateKendalaSelesai = async (req) => {
    const transaction = await db.sequelize.transaction();
    try {
        const laporanId = req.params.id_laporan;
        const body = req.body;
        const { currentDatetime } = getMetadataInfo(req);

        const payload = {
            kendala_selesai: body.kendala_selesai,
            // updated_at: currentDatetime
        };

        await laporanHarianRepo.updateReviewStatus(laporanId, payload, transaction);
        await transaction.commit();
        return { message: 'Status kendala berhasil diperbarui' };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// exports module
module.exports = {
    getAllLaporanHarian,
    getLaporanById,
    createLaporanHarian,
    updateLaporanHarian,
    softDeleteLaporanHarian,
    updateReviewStatus,
    updateKendalaSelesai
};