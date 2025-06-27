// library
const { Op } = require('sequelize');
const moment = require('moment');

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

//model
const db = require('../../database/mysql.connection');
const sequelize = db.sequelize;
const laporanHarian = db.laporan_harian;
const laporanHarianDetail = db.laporan_harian_detail;
const pengguna = db.pengguna;
const jabatan = db.jabatan;
const lampiran = db.lampiran;
const projek= db.projek;

// get all laporan harian
const findAll = async (options = {}, filter, level, penggunaId) => {
    try {
        const { offset, limit } = options;
        let { status_laporan, tanggal, search, sudah_direview, kendala_selesai, id_projek, id_jabatan } = filter;

        const isAtasan = [1, 2, 3].includes(level);
        const isKaryawan = level >= 4;

        // Base config
        const config = {
            offset,
            limit,
            order: [['updated_at', 'DESC']],
            where: {
                status: {
                    [Op.ne]: 0
                }
            },
            include: [
                {
                    model: pengguna,
                    as: 'pengguna',
                    attributes: ['id_pengguna', 'nama'],
                    include: [
                        {
                            model: jabatan,
                            as: 'jabatan',
                            attributes: ['id_jabatan', 'jabatan']
                        }
                    ]
                },
                {
                    model: projek,
                    as: 'projek',
                    attributes: ['id_projek', 'projek']
                },
                {
                    model: laporanHarianDetail,
                    as: 'detail_laporan',
                    attributes: ['id_harian_detail', 'konten', 'isi_konten'],
                    required: false
                }
            ]
        };

        // 1. Filter akses berdasarkan level
        if (isKaryawan) {
            config.where.id_pengguna = penggunaId;
        }

        if (isAtasan) {
            if (id_jabatan) {
                // Filter by specific jabatan
                config.where.id_pengguna = {
                    [Op.in]: sequelize.literal(`(
                        SELECT id_pengguna FROM pengguna 
                        WHERE id_jabatan = '${id_jabatan}'
                    )`)
                };
            } else {
                // Default atasan behavior (get bawahan)
                const penggunaAtasan = await pengguna.findOne({
                    where: { id_pengguna: penggunaId },
                    include: [
                        {
                            model: jabatan,
                            as: 'jabatan',
                            attributes: ['id_jabatan', 'jabatan']
                        }
                    ]
                });
                
                if (!penggunaAtasan?.jabatan) {
                    throw new Error('Data jabatan pengguna tidak ditemukan');
                }
                
                const bawahan = await pengguna.findAll({
                    where: {
                        id_jabatan: {
                            [Op.in]: sequelize.literal(`(
                                SELECT id_jabatan FROM jabatan WHERE parent = '${penggunaAtasan.jabatan.id_jabatan}'
                            )`)
                        }
                    },
                    attributes: ['id_pengguna']
                });
                
                config.where.id_pengguna = {
                    [Op.in]: bawahan.length > 0 ? bawahan.map(p => p.id_pengguna) : [null]
                };
            }
        }

        // 2. Filter status laporan
        if (status_laporan) {
            config.where.status_laporan = status_laporan;
        } else if (isAtasan) {
            config.where.status_laporan = 'publish';
        }

        // 3. Filter tanggal
        if (tanggal) {
            config.where.updated_at = {
                [Op.between]: [
                    moment(tanggal).startOf('day').toDate(),
                    moment(tanggal).endOf('day').toDate()
                ]
            };
        }

        // 4. Filter search
        if (search) {
            config.where[Op.and] = [
                ...(config.where[Op.and] || []),
                {
                    [Op.or]: [
                        { judul: { [Op.like]: `%${search}%` }},
                        sequelize.literal(`EXISTS (
                            SELECT 1 FROM laporan_harian_detail 
                            WHERE laporan_harian_detail.id_laporan = laporan_harian.id_laporan
                            AND laporan_harian_detail.isi_konten LIKE '%${search}%'
                        )`)
                    ]
                }
            ];
        }

        if (sudah_direview !== undefined) {
            config.where.sudah_direview = sudah_direview;
        }

        if (kendala_selesai !== undefined) {
            if (kendala_selesai === null) {
                config.where.kendala_selesai = { [Op.is]: null };
            } else {
                config.where.kendala_selesai = kendala_selesai;
            }
        }

        if (id_projek) {
            config.where.id_projek = id_projek;
        }

        const data = await laporanHarian.findAll(config);

        // Format hasil
        return data.map(item => ({
            id: item.id_laporan,
            tanggal: moment(item.updated_at).format('YYYY-MM-DD'),
            judul: item.judul,
            projek: item.projek?.projek,
            status_laporan: item.status_laporan || null, 
            pengirim: isAtasan ? (item.pengguna?.nama || 'Tidak diketahui') : null,
            jabatan: isAtasan ? (item.pengguna?.jabatan?.jabatan || 'Tidak diketahui') : null,
            status: item.status,
            sudah_direview: item.sudah_direview,
            kendala_selesai: item.kendala_selesai
        }));
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// hitung total laporan
const count = async (filter, level, penggunaId) => {
    try {
        let { status_laporan, tanggal, search, sudah_direview, kendala_selesai, id_projek, id_jabatan } = filter;
        const isAtasan = [1, 2, 3].includes(level);
        const isKaryawan = level >= 4;

        const config = {
            where: {
                status: {
                    [Op.ne]: 0
                }
            }
        };

        if (isKaryawan) {
            config.where.id_pengguna = penggunaId;
        }

        if (isAtasan) {
            if (id_jabatan) {
                config.where.id_pengguna = {
                    [Op.in]: sequelize.literal(`(
                        SELECT id_pengguna FROM pengguna 
                        WHERE id_jabatan = '${id_jabatan}'
                    )`)
                };
            } else {
                const penggunaAtasan = await pengguna.findOne({
                    where: { id_pengguna: penggunaId },
                    include: [
                        {
                            model: jabatan,
                            as: 'jabatan',
                            attributes: ['id_jabatan', 'jabatan']
                        }
                    ]
                });
                
                if (!penggunaAtasan?.jabatan) {
                    throw new Error('Data jabatan pengguna tidak ditemukan');
                }
                
                const bawahan = await pengguna.findAll({
                    where: {
                        id_jabatan: {
                            [Op.in]: sequelize.literal(`(
                                SELECT id_jabatan FROM jabatan WHERE parent = '${penggunaAtasan.jabatan.id_jabatan}'
                            )`)
                        }
                    },
                    attributes: ['id_pengguna']
                });
                
                config.where.id_pengguna = {
                    [Op.in]: bawahan.length > 0 ? bawahan.map(p => p.id_pengguna) : [null]
                };
            }
        }
        
        if (status_laporan) {
            config.where.status_laporan = status_laporan;
        } else if (isAtasan) {
            config.where.status_laporan = 'publish';
        }

        if (tanggal) {
            config.where.updated_at = {
                [Op.between]: [
                    moment(tanggal).startOf('day').toDate(),
                    moment(tanggal).endOf('day').toDate()
                ]
            };
        }

        if (search) {
            config.where[Op.and] = [
                ...(config.where[Op.and] || []),
                {
                    [Op.or]: [
                        { judul: { [Op.like]: `%${search}%` }},
                        sequelize.literal(`EXISTS (
                            SELECT 1 FROM laporan_harian_detail 
                            WHERE laporan_harian_detail.id_laporan = laporan_harian.id_laporan
                            AND laporan_harian_detail.isi_konten LIKE '%${search}%'
                        )`)
                    ]
                }
            ];
        }

        if (sudah_direview !== undefined) {
            config.where.sudah_direview = sudah_direview;
        }
        
        if (kendala_selesai !== undefined) {
            if (kendala_selesai === null) {
                config.where.kendala_selesai = { [Op.is]: null };
            } else {
                config.where.kendala_selesai = kendala_selesai;
            }
        }

        if (id_projek) {
            config.where.id_projek = id_projek;
        }

        return await laporanHarian.count(config);
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// get detail laporan harian by findone
const findOne = async (laporanId, penggunaId) => {
    try {
        // 1. Cari data pengguna yang request beserta jabatannya
        const user = await pengguna.findOne({
            where: { id_pengguna: penggunaId },
            include: [{
                model: jabatan,
                as: 'jabatan',
                attributes: ['id_jabatan', 'jabatan', 'parent', 'level']
            }]
        });

        if (!user || !user.jabatan) {
            throw new Error('Pengguna atau jabatan tidak ditemukan');
        }

        // 2. Siapkan kondisi akses
        const accessConditions = [{ id_pengguna: penggunaId }]; // Selalu bisa akses laporan sendiri

        // 3. Tambahkan kondisi jika punya bawahan langsung
        if (user.jabatan.parent) {
            accessConditions.push({
                id_pengguna: {
                    [Op.in]: sequelize.literal(`(
                        SELECT p.id_pengguna 
                        FROM pengguna p
                        WHERE p.id_jabatan IN (
                            SELECT j.id_jabatan 
                            FROM jabatan j 
                            WHERE j.parent = '${user.jabatan.id_jabatan}'
                        )
                    )`)
                }
            });
        }

        // 4. Config query untuk laporan harian
        let config = {
            where: {
                id_laporan: laporanId,
                [Op.or]: accessConditions
            },
            include: [
                {
                    model: pengguna,
                    as: 'pengguna',
                    attributes: ['id_pengguna', 'nama', 'email'],
                    include: [{
                        model: jabatan,
                        as: 'jabatan',
                        attributes: ['jabatan', 'divisi']
                    }]
                },
                {
                    model: projek,
                    as: 'projek',
                    attributes: ['id_projek', 'projek']
                },
                {
                    model: laporanHarianDetail,
                    as: 'detail_laporan',
                    attributes: ['id_harian_detail', 'konten', 'isi_konten', 'created_at'],
                    order: [['created_at', 'ASC']]
                },
                {
                    model: lampiran,
                    as: 'lampiran',
                    attributes: ['id_lampiran', 'nama_lampiran', 'lampiran_label']
                }
            ]
        };

        // 5. Eksekusi query
        const data = await laporanHarian.findOne(config);

        if (!data) {
            throw new Error('Laporan tidak ditemukan atau tidak memiliki akses');
        }

        // 6. Format data response
        const orderedKonten = ['selesai', 'kendala', 'rencana'];

        const orderedDetail = orderedKonten
            .map(kontenKey => (data.detail_laporan || []).find(d => d.konten === kontenKey))
            .filter(Boolean); // Buang null/undefined kalau kontennya nggak ada

        return {
            laporan: {
                id: data.id_laporan,
                judul: data.judul,
                status_laporan: data.status_laporan,
                created_at: moment(data.created_at).locale('en').format('DD MMM YYYY, HH:mm'),
                updated_at: data.updated_at 
                    ? moment(data.updated_at).locale('en').format('DD MMM YYYY, HH:mm') 
                    : null,
                sudah_direview: data.sudah_direview,
                kendala_selesai: data.kendala_selesai
            },
            projek: data.projek ? { 
                id: data.projek.id_projek,
                nama: data.projek.projek
            } : null,
            detail: orderedDetail.map(detail => ({
                id_harian_detail: detail.id_harian_detail,
                konten: detail.konten,
                isi_konten: detail.isi_konten,
            })),
            lampiran: (data.lampiran || []).map(file => ({
                id_lampiran: file.id_lampiran,
                lampiran_label: file.lampiran_label || file.nama_lampiran,
                nama_lampiran: file.nama_lampiran
            }))
        };
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// create laporan harian
const createLaporanHarian = async (payload, transaction = null) => {
    try {
        const config = {transaction};
        return await laporanHarian.create(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// create laporan harian detail
const createLaporanHarianDetail = async (payload, transaction = null) => {
    try {
        const config = {transaction};
        return await laporanHarianDetail.bulkCreate(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// create single
const createSingleLaporanHarianDetail = async (payload, transaction = null) => {
    try {
        const config = {transaction};
        return await laporanHarianDetail.create(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// update laporan harian
const updateLaporanHarian = async (id_laporan, payload, transaction = null) => {
    try {
        const config = {
            where : {id_laporan},
            transaction
        };
        return await laporanHarian.update(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// update satu baris detail berdasarkan id_harian_detail
const updateLaporanHarianDetail = async (id_harian_detail, payload, transaction = null) => {
    try {
        return await laporanHarianDetail.update(payload, {
            where: { id_harian_detail },
            transaction,
        });
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// get laporan harian by id untuk update dan soft delete
const getLaporanHarianById = async (laporanId) => {
    try {
        return await laporanHarian.findOne({ 
            where: { id_laporan: laporanId }
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// get detail laporan harian by laporan harian id
const getHarainDetailByLaporanId = async (laporanId) => {
    try {
        return await laporanHarianDetail.findAll({ 
            where: { id_laporan: laporanId }
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// soft delete laporan harian
const softDeleteLaporanHarian = async (laporanId, transaction = null) => {
    try {
        const config = {
            where: { id_laporan : laporanId },
            transaction
        };
        const [updated] = await laporanHarian.update(
            { status: 0, updated_at: new Date() },
            config
        );
        return updated > 0;
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

// update status review
const updateReviewStatus = async (id_laporan, payload, transaction = null) => {
    try {
        const config = {
            where: { id_laporan },
            transaction
        };
        return await laporanHarian.update(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

// update status kendala
const updateKendalaSelesai = async (id_laporan, payload, transaction = null) => {
    try {
        const config = {
            where: { id_laporan },
            transaction
        };
        return await laporanHarian.update(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message, errorObj);
    }
};

// delete laporan harian detail
const deleteLaporanHarianDetail = async (detailId, transaction = null) => {
    try {
        const config = {
            where: { id_harian_detail: detailId },
            transaction
        };
        return await laporanHarianDetail.destroy(config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// exports module
module.exports = {
    findAll,
    count,
    findOne,
    createLaporanHarian,
    createLaporanHarianDetail,
    createSingleLaporanHarianDetail,
    updateLaporanHarian,
    getLaporanHarianById,
    updateLaporanHarianDetail,
    getHarainDetailByLaporanId,
    softDeleteLaporanHarian,
    updateReviewStatus,
    updateKendalaSelesai,
    deleteLaporanHarianDetail
};
