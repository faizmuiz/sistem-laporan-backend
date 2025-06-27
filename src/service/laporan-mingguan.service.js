// library
const { v7: uuidv7 } = require('uuid');
const moment = require('moment'); 
moment.locale('id');

// exception
const ErrorNotFoundException = require('../../exception/error-not-found.exception').ErrorNotFoundException;
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const { getMetadataInfo } = require('../../utility/metadata-info.utility');

// db
const db = require('../../database/mysql.connection'); 

// repo
const laporanMingguanRepo = require('../repository/laporan-mingguan.repository');

// get all
const getAllLaporanMingguan = async (req) => {
    try {
        const { penggunaId, level } = getMetadataInfo(req);
        const pageNumber = parseInt(req.query.number) || 1;
        const pageSize = parseInt(req.query.size) || 7;

        const options = {
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize
        };

        const filter = {
            search: req.query.search || null,
            periode_awal: req.query.periode_awal || null,
            periode_akhir: req.query.periode_akhir || null,
            pengguna: req.query.pengguna || null
        };

        const data = await laporanMingguanRepo.findAll(options, filter, level, penggunaId);
        const totalData = await laporanMingguanRepo.count(filter, level, penggunaId);

        return {
            page: {
                total_record_count: totalData,
                batch_number: pageNumber,
                batch_size: data.length,
                max_batch_size: pageSize
            },
            records: data.map(item => ({
                id_laporan_mingguan: item.id_laporan_mingguan,
                id_pengguna: item.id_pengguna,
                judul: item.judul,
                periode_awal: item.periode_awal,
                periode_akhir: item.periode_akhir,
                pengguna: item.pengguna?.nama || null,
                jabatan: item.pengguna?.jabatan?.jabatan || null
            }))
        };
    } catch (err) {
        console.error(err);
        throw new ErrorQueryException('Gagal mengambil data laporan mingguan');
    }
};

// find detail laporan mingguan by laporan mingguan id
const findDetailByIdLaporanMingguan = async (idLaporanMingguan) => {
    try {
        const data = await laporanMingguanRepo.findDetailByIdLaporanMingguan(idLaporanMingguan);
        
        if (!data || data.length === 0) {
            throw new ErrorNotFoundException('Data tidak ditemukan');
        }

        return data;
    } catch (error) {
        throw new ErrorQueryException(error.message || 'Gagal mengambil detail laporan mingguan');
    }
};

// ringkasan
const getRingkasanLaporanMingguan = async (idLaporanMingguan) => {
    try {
        const data = await laporanMingguanRepo.getRingkasanByIdLaporanMingguan(idLaporanMingguan);

        if (!data || data.length === 0) {
            throw new Error('Data tidak ditemukan');
        }

        const laporanMingguan = data[0].laporan_mingguan;
        const ringkasan = {
            judul: laporanMingguan.judul,
            periode: `${moment(laporanMingguan.periode_awal).format('YYYY-MM-DD')} s.d ${moment(laporanMingguan.periode_akhir).format('YYYY-MM-DD')}`,
            selesai: [],
            kendala: [],
            rencana: [],
        };

        data.forEach(item => {
            const detailList = item.laporan_harian?.detail_laporan || [];
            detailList.forEach(detail => {
                if (detail.konten === 'selesai') {
                    // Menambahkan konten 'selesai' dan menghindari duplikat
                    if (!ringkasan.selesai.includes(detail.isi_konten)) {
                        ringkasan.selesai.push(detail.isi_konten);
                    }
                } else if (detail.konten === 'kendala') {
                    // Menambahkan konten 'kendala' dan menghindari duplikat
                    if (!ringkasan.kendala.includes(detail.isi_konten)) {
                        ringkasan.kendala.push(detail.isi_konten);
                    }
                } else if (detail.konten === 'rencana') {
                    // Menambahkan konten 'rencana' dan menghindari duplikat
                    if (!ringkasan.rencana.includes(detail.isi_konten)) {
                        ringkasan.rencana.push(detail.isi_konten);
                    }
                }
            });
        });

        // Menggunakan Set untuk memastikan tidak ada duplikasi
        ringkasan.selesai = [...new Set(ringkasan.selesai)];
        ringkasan.kendala = [...new Set(ringkasan.kendala)];
        ringkasan.rencana = [...new Set(ringkasan.rencana)];

        return ringkasan;

    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// create laporan mingguan
const createLaporanMingguan = async (req) => {
    const t = await db.sequelize.transaction();

    try {
        const { startDate, endDate } = req.query;
        const start = moment(startDate).startOf('day').toDate();
        const end = moment(endDate).endOf('day').toDate();

        const { penggunaId, jabatanId } = getMetadataInfo(req);
        const idPenggunaAtasan = penggunaId;
        const idJabatan = jabatanId;
        
        // Step A: Ambil nama jabatan
        const namaJabatan = await laporanMingguanRepo.getNamaJabatanByPenggunaId(idPenggunaAtasan);
        if (!namaJabatan) {
            throw new ErrorNotFoundException('Jabatan tidak ditemukan untuk pengguna ini');
        }

        // Step B: Hitung jumlah laporan mingguan sebelumnya di bulan yang sama
        const awalBulan = moment(startDate).startOf('month').toDate();
        const akhirBulan = moment(startDate).endOf('month').toDate();

        const jumlahLaporanSebelumnya = await laporanMingguanRepo.countLaporanMingguanByJabatanAndMonth(
            idJabatan,
            awalBulan,
            akhirBulan
        );

        const mingguKe = jumlahLaporanSebelumnya + 1;
        const namaBulan = moment(startDate).format('MMMM');
        const tahun = moment(startDate).format('YYYY');

        // Step C: Buat judul
        const judul = `Laporan Mingguan ${namaJabatan} ${namaBulan} ke-${mingguKe}`;

        // Step 1: Ambil semua bawahan berdasarkan jabatan atasan
        const bawahan = await laporanMingguanRepo.getBawahanByAtasan(idJabatan);
        if (!bawahan.length) {
            throw new ErrorNotFoundException('Tidak ditemukan pengguna bawahan');
        }

        const idPenggunaBawahan = bawahan.map(p => p.id_pengguna);

        // Step 2: Ambil semua laporan harian yang publish dari bawahan dalam rentang tanggal
        const laporanHarianList = await laporanMingguanRepo.getLaporanHarianByBawahanAndDateRange(
            idPenggunaBawahan,
            start,
            end
        );

        // Step 3: Siapkan detail berdasarkan id laporan harian & id detail laporan harian
        const detailList = [];

        for (const laporan of laporanHarianList) {
            const idLaporanHarian = laporan.id_laporan;
        
            for (const detail of laporan.detail_laporan) {
                detailList.push({
                    id_mingguan_detail: uuidv7(),
                    id_laporan_mingguan: null,
                    id_laporan: idLaporanHarian,
                    id_harian_detail: detail.id_harian_detail
                });
            }
        }             

        // Step 4: Simpan laporan mingguan
        const laporanMingguanPayload = {
            id_laporan_mingguan: uuidv7(),
            id_pengguna: idPenggunaAtasan,
            judul,
            periode_awal: start,
            periode_akhir: end,
            created_at: new Date(),
            updated_at: new Date(),
        };

        await laporanMingguanRepo.createLaporanMingguan(laporanMingguanPayload, t);

        // Step 5: Tambahkan id laporan mingguan ke setiap detail
        const detailWithLaporanId = detailList.map(detail => ({
            ...detail,
            id_laporan_mingguan: laporanMingguanPayload.id_laporan_mingguan
        }));

        await laporanMingguanRepo.bulkInsertLaporanMingguanDetail(detailWithLaporanId, t);

        await t.commit();

        return {
            message: 'Laporan mingguan berhasil dibuat',
            id_laporan_mingguan: laporanMingguanPayload.id_laporan_mingguan,
            judul: laporanMingguanPayload.judul,
            periode_mulai: startDate,
            periode_selesai: endDate
        };

    } catch (error) {
        await t.rollback();
        throw new ErrorQueryException(error.message || 'Gagal membuat laporan mingguan');
    }
};

module.exports = {
    getAllLaporanMingguan,
    findDetailByIdLaporanMingguan,
    getRingkasanLaporanMingguan,
    createLaporanMingguan,
};