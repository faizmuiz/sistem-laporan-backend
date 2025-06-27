// library
const { Op } = require('sequelize');
const moment = require('moment');

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

//model
const db = require('../../database/mysql.connection');
const laporanHarian = db.laporan_harian;
const laporanHarianDetail = db.laporan_harian_detail;
const laporanMingguan = db.laporan_mingguan;
const laporanMingguanDetail = db.laporan_mingguan_detail;
const pengguna = db.pengguna;
const jabatan = db.jabatan;

// get all
const findAll = async (options = {}, filter, level, penggunaId) => {
    try {
        const { offset, limit } = options;
        let { search, periode_awal, periode_akhir, pengguna: namaPengguna } = filter; 
        
        const config = {
            offset,
            limit,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: pengguna, 
                    as: 'pengguna',
                    attributes: ['id_pengguna', 'nama'],
                    include: [{
                        model: jabatan,
                        as: 'jabatan',
                        attributes: ['id_jabatan', 'jabatan']
                    }],
                    where: namaPengguna ? { nama: { [Op.like]: `%${namaPengguna}%` } } : undefined
                }
            ],
            attributes: ['id_laporan_mingguan', 'id_pengguna', 'judul', 'periode_awal', 'periode_akhir'],
            where: {}
        };

        // Filter untuk level 2 dan 3 (hanya tampilkan laporan mereka sendiri)
        if (level === 2 || level === 3) {
            config.where.id_pengguna = penggunaId;
        }

        // Filter periode
        if (periode_awal && periode_akhir) {
            config.where[Op.and] = [
                { periode_awal: { [Op.gte]: periode_awal } },
                { periode_akhir: { [Op.lte]: periode_akhir } }
            ];
        }

        // Filter search
        if (search) {
            config.where[Op.or] = [
                { judul: { [Op.like]: `%${search}%` } },
                sequelize.literal(`EXISTS (
                    SELECT 1 FROM laporan_mingguan_detail 
                    JOIN laporan_harian_detail ON laporan_mingguan_detail.id_harian_detail = laporan_harian_detail.id_harian_detail
                    WHERE laporan_mingguan_detail.id_laporan_mingguan = laporan_mingguan.id_laporan_mingguan
                    AND laporan_harian_detail.isi_konten LIKE '%${search}%'
                )`)
            ];
        }

        return await laporanMingguan.findAll(config);
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// count
const count = async (filter, level, penggunaId) => {
    try {
        let { search, periode_awal, periode_akhir, pengguna: namaPengguna } = filter;

        const config = {
            include: [
                {
                    model: pengguna,
                    as: 'pengguna',
                    attributes: [],
                    where: namaPengguna ? { nama: { [Op.like]: `%${namaPengguna}%` } } : undefined,
                    required: !!namaPengguna
                }
            ],
            where: {}
        };

        if (level === 2 || level === 3) {
            config.where.id_pengguna = penggunaId;
        }

        if (periode_awal && periode_akhir) {
            config.where[Op.and] = [
                { periode_awal: { [Op.gte]: periode_awal } },
                { periode_akhir: { [Op.lte]: periode_akhir } }
            ];
        }

        if (search) {
            config.where[Op.or] = [
                { judul: { [Op.like]: `%${search}%` } },
                sequelize.literal(`EXISTS (
                    SELECT 1 FROM laporan_mingguan_detail 
                    JOIN laporan_harian_detail ON laporan_mingguan_detail.id_harian_detail = laporan_harian_detail.id_harian_detail
                    WHERE laporan_mingguan_detail.id_laporan_mingguan = laporan_mingguan.id_laporan_mingguan
                    AND laporan_harian_detail.isi_konten LIKE '%${search}%'
                )`)
            ];
        }

        return await laporanMingguan.count(config);
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// get detail laporan mingguan berdasarkan id laporan mingguan
const findDetailByIdLaporanMingguan = async (idLaporanMingguan) => {
    try {
        const data = await laporanMingguanDetail.findAll({
            where: { id_laporan_mingguan: idLaporanMingguan },
            include: [
                {
                    model: laporanHarian,
                    as: 'laporan_harian',
                    attributes: ['id_laporan', 'judul', 'created_at'],
                    include: [
                        {
                            model: pengguna,
                            as: 'pengguna',
                            attributes: ['id_pengguna', 'nama'],
                        },
                        {
                            model: laporanHarianDetail,
                            as: 'detail_laporan',
                            attributes: ['id_harian_detail', 'konten', 'isi_konten'],
                        },
                    ],
                },
                {
                    model: laporanMingguan,
                    as: 'laporan_mingguan',
                    attributes: ['id_laporan_mingguan', 'id_pengguna', 'judul', 'periode_awal', 'periode_akhir'],
                }
            ],
        });

        if (!data || data.length === 0) {
            throw new ErrorNotFoundException('Data tidak ditemukan');
        }

        const groupedMap = {};

        for (const item of data) {
            const idLaporan = item.laporan_harian?.id_laporan;
            const idMingguanDetail = item.id_mingguan_detail;

            if (!idLaporan || !item.laporan_harian) continue;

            if (!groupedMap[idLaporan]) {
                groupedMap[idLaporan] = {
                    id_mingguan_detail: idMingguanDetail,
                    konten: {
                        id_laporan: idLaporan,
                        tanggal_laporan: item.laporan_harian.created_at,
                        judul_laporan: item.laporan_harian.judul,
                        nama_pengguna: item.laporan_harian.pengguna?.nama,
                        detail_konten: []
                    }
                };
            }

            const detailLaporanList = item.laporan_harian.detail_laporan || [];

            for (const detail of detailLaporanList) {
                const alreadyExists = groupedMap[idLaporan].konten.detail_konten
                    .some(d => d.id_harian_detail === detail.id_harian_detail);

                if (!alreadyExists) {
                    groupedMap[idLaporan].konten.detail_konten.push({
                        id_harian_detail: detail.id_harian_detail,
                        konten: detail.konten,
                        isi_konten: detail.isi_konten,
                    });
                }
            }
        }

        const detailList = Object.values(groupedMap);

        const laporanMingguanData = data[0].laporan_mingguan;

        return {
            mingguan: {
                id_laporan_mingguan: laporanMingguanData.id_laporan_mingguan,
                id_pengguna: laporanMingguanData.id_pengguna,
                judul: laporanMingguanData.judul,
                periode_awal: moment(laporanMingguanData.periode_awal).format('YYYY-MM-DD'),
                periode_akhir: moment(laporanMingguanData.periode_akhir).format('YYYY-MM-DD'),
            },
            detail: detailList,
        };
        
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// get detail lebih ringkas
const getRingkasanByIdLaporanMingguan = async (idLaporanMingguan) => {
    const data = await laporanMingguanDetail.findAll({
        where: { id_laporan_mingguan: idLaporanMingguan },
        include: [
            {
                model: laporanHarian,
                as: 'laporan_harian',
                include: [
                    {
                        model: laporanHarianDetail,
                        as: 'detail_laporan',
                        attributes: ['konten', 'isi_konten'],
                    }
                ]
            },
            {
                model: laporanMingguan,
                as: 'laporan_mingguan',
                attributes: ['judul', 'periode_awal', 'periode_akhir'],
            }
        ]
    });

    return data;
};

// get all bawahan berdasarkan parent jabatan atasan
const getBawahanByAtasan = async (idJabatanAtasan) => {
    // Ambil dulu jabatan-jabatan yang parent-nya idJabatanAtasan
    const jabatanBawahan = await jabatan.findAll({
        where: { parent: idJabatanAtasan },
        attributes: ['id_jabatan'],
    });

    const idJabatanBawahan = jabatanBawahan.map(j => j.id_jabatan);

    if (!idJabatanBawahan.length) return [];

    // Ambil pengguna yang memiliki id_jabatan dalam list itu
    const penggunaBawahan = await pengguna.findAll({
        where: {
            id_jabatan: idJabatanBawahan,
        },
    });

    return penggunaBawahan;
};

// ambil semua laporan harian bawahan berdasarkan periode tanggal
const getLaporanHarianByBawahanAndDateRange = async (idPenggunaArray, startDate, endDate) => {
    try {
        const data = await laporanHarian.findAll({
            where: {
                id_pengguna: {
                    [Op.in]: idPenggunaArray,
                },
                status_laporan: 'publish',
                created_at: { // masih pake created at
                    [Op.between]: [startDate, endDate],
                },
            },
            include: [
                {
                    model: laporanHarianDetail,
                    as: 'detail_laporan',
                },
            ],
            order: [['created_at', 'ASC']], // ini juga
        });

        return data;
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// simpan laporan mingguan (dengan transaction opsional)
const createLaporanMingguan = async (payload, transaction = null) => {
    try {
        const config = { transaction }; 
        return await laporanMingguan.create(payload, config); 
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// simpan detail laporan mingguan (dengan transaction opsional)
const bulkInsertLaporanMingguanDetail = async (payload, transaction = null) => {
    try {
        const config = { transaction }; 
        return await laporanMingguanDetail.bulkCreate(payload, config); 
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// get nama jabatan
const getNamaJabatanByPenggunaId = async (idPengguna) => {
    const penggunaData = await pengguna.findOne({
        where: { id_pengguna: idPengguna },
        include: [
            {
                model: jabatan,
                as: 'jabatan', // pastikan alias ini sesuai dengan yang didefinisikan di model
                attributes: ['jabatan']
            }
        ]
    });

    if (!penggunaData || !penggunaData.jabatan) return null;
    return penggunaData.jabatan.jabatan;
};

// count laporan mingguan
const countLaporanMingguanByJabatanAndMonth = async (idJabatan, startOfMonth, endOfMonth) => {
    const penggunaList = await pengguna.findAll({
        where: { id_jabatan: idJabatan },
        attributes: ['id_pengguna']
    });
    
    const idPenggunaList = penggunaList.map(p => p.id_pengguna);
    
    return await laporanMingguan.count({
        where: {
            id_pengguna: { [Op.in]: idPenggunaList },
            periode_awal: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth }
        }
    });
};

module.exports = {
    findAll,
    count,
    findDetailByIdLaporanMingguan,
    getRingkasanByIdLaporanMingguan,
    getBawahanByAtasan,
    getLaporanHarianByBawahanAndDateRange,
    createLaporanMingguan,
    bulkInsertLaporanMingguanDetail,
    getNamaJabatanByPenggunaId,
    countLaporanMingguanByJabatanAndMonth
};
