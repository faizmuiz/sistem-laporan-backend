'use strict';

// utility
const resFormat = require('../../utility/response-api');
const { getMetadataInfo } = require('../../utility/metadata-info.utility');

// db
const db = require('../../database/mysql.connection');

// repo
const dashboardRepo = require('../repository/dashboard.repository');

// service
const dashboardService = require('../service/dashboard.service');

// DASHBOARD KARYAWAN
// 1. Get total laporan, sudah review, dan belum review
const getTotalLaporanDanReview = async (req, res, next) => {
    try {
        const data = await dashboardService.getTotalLaporanDanReview(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// 2. Get status laporan (draft dan publish)
const getStatusLaporan = async (req, res, next) => {
    try {
        const data = await dashboardService.getStatusLaporan(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// 3. Get list kendala
const getListKendala = async (req, res, next) => {
    try {
        const data = await dashboardService.getListKendala(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// 4. Get informasi kendala
const getInformasiKendala = async (req, res, next) => {
    try {
        const data = await dashboardService.getInformasiKendala(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// 5. Get task completion percentage per project
const getPresentasetask = async (req, res, next) => {
    try {
        const data = await dashboardService.getPresentasetask(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// 6. Get total task status counts
const getTotalTaskStatus = async (req, res, next) => {
    try {
        const data = await dashboardService.getTotalTaskStatus(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// DASHBOARD ATASAN
// 1. Get total reports from subordinates
const getTotalLaporanBawahan = async (req, res, next) => {
    try {
        const data = await dashboardService.getTotalLaporanBawahan(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// 2. Get list of subordinates with statistics
const getDaftarBawahan = async (req, res, next) => {
    try {
        const data = await dashboardService.getDaftarBawahan(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// 3. get informasi projek
const getInformasiProjek = async (req, res, next) => {
    try {
        const data = await dashboardService.getInformasiProjek(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
};

// DASHBOARD DIREKTUR
// 1. get daftar atasan
const getDaftarAtasan = async (req, res, next) => {
    try {
        const data = await dashboardService.getDaftarAtasan(req);
        res.status(200).send(resFormat({ code: 200 }, data));
    } catch (error) {
        next(error);
    }
}

// DRILL DOWN
const getDashboardAtasanById = async (req, res, next) => {
    try {
        const idPenggunaAtasan = req.params.id_pengguna_atasan;
        
        // Get the atasan's data first
        const atasan = await db.pengguna.findOne({
            where: { id_pengguna: idPenggunaAtasan },
            include: [{
                model: db.jabatan,
                as: 'jabatan',
                attributes: ['id_jabatan']
            }],
            raw: true,
            nest: true
        });
        
        if (!atasan) {
            throw new ErrorNotFoundException('Atasan tidak ditemukan');
        }

        // Buat request baru dengan id_jabatan atasan
        const modifiedReq = {
            ...req,
            metadata: { 
                ...req.metadata, 
                jabatanId: atasan.jabatan.id_jabatan,
                penggunaId: idPenggunaAtasan 
            }
        };
        
        // Panggil semua service yang dibutuhkan untuk dashboard atasan
        const [laporanBawahan, daftarBawahan, infoProjek] = await Promise.all([
            dashboardRepo.getTotalLaporanBawahan(
                atasan.jabatan.id_jabatan, 
                atasan.jabatan.id_jabatan 
            ),
            dashboardRepo.getDaftarBawahan(atasan.jabatan.id_jabatan, null),
            dashboardService.getInformasiProjek(req, idPenggunaAtasan)
        ]);
        
        res.status(200).send(resFormat({ code: 200 }, {
            laporan_bawahan: laporanBawahan,
            daftar_bawahan: daftarBawahan,
            informasi_projek: infoProjek
        }));
    } catch (error) {
        next(error);
    }
};

const getDashboardBawahanById = async (req, res, next) => {
    try {
        const idPenggunaBawahan = req.params.id_pengguna_bawahan;
        
        // Verify the bawahan is actually under this atasan
        const { jabatanId } = getMetadataInfo(req);
        const bawahanIds = await dashboardRepo.getBawahanPenggunaByJabatan(jabatanId);
        
        // if (!bawahanIds.includes(parseInt(idPenggunaBawahan))) {
        //     throw new ErrorForbiddenException('Anda tidak memiliki akses ke data bawahan ini');
        // }

        // Get bawahan data to ensure they exist
        const bawahan = await db.pengguna.findOne({
            where: { id_pengguna: idPenggunaBawahan }
        });
        
        if (!bawahan) {
            throw new ErrorNotFoundException('Bawahan tidak ditemukan');
        }

        // Panggil semua service yang dibutuhkan untuk dashboard karyawan
        const [totalReview, statusLaporan, listKendala, infoKendala, presentaseTask, taskStatus] = await Promise.all([
            dashboardRepo.getTotalLaporanDanReview(idPenggunaBawahan),
            dashboardRepo.getStatusLaporan(idPenggunaBawahan),
            dashboardRepo.getListKendala(idPenggunaBawahan),
            dashboardRepo.getInformasiKendala(idPenggunaBawahan),
            dashboardRepo.getPresentasetask(idPenggunaBawahan),
            dashboardRepo.getTotalTaskStatus(idPenggunaBawahan)
        ]);
        
        res.status(200).send(resFormat({ code: 200 }, {
            total_review: totalReview,
            status_laporan: statusLaporan,
            list_kendala: listKendala,
            informasi_kendala: infoKendala,
            presentase_task: presentaseTask,
            task_status: taskStatus
        }));
    } catch (error) {
        next(error);
    }
};

// export module
module.exports = {
    getTotalLaporanDanReview,
    getStatusLaporan,
    getListKendala,
    getInformasiKendala,
    getPresentasetask,
    getTotalTaskStatus,

    getTotalLaporanBawahan,
    getDaftarBawahan,
    getInformasiProjek,

    getDaftarAtasan,

    getDashboardAtasanById,
    getDashboardBawahanById
};