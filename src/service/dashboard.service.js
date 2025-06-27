// exception
const ErrorNotFoundException = require('../../exception/error-not-found.exception').ErrorNotFoundException;
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const { getMetadataInfo } = require('../../utility/metadata-info.utility');

// db
const db = require('../../database/mysql.connection'); 

// repo
const dashboardRepo = require('../repository/dashboard.repository');

// DASHBOARD KARYAWAN

// 1. Get total laporan, sudah review, dan belum review
const getTotalLaporanDanReview = async (req) => {
    try {
        const { penggunaId } = getMetadataInfo(req);
        return await dashboardRepo.getTotalLaporanDanReview(penggunaId);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil data total laporan dan review');
    }
};

// 2. Get status laporan (draft dan publish)
const getStatusLaporan = async (req) => {
    try {
        const { penggunaId } = getMetadataInfo(req);
        return await dashboardRepo.getStatusLaporan(penggunaId);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil data status laporan');
    }
};

// 3. Get list kendala
const getListKendala = async (req) => {
    try {
        const { penggunaId } = getMetadataInfo(req);
        return await dashboardRepo.getListKendala(penggunaId);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil daftar kendala');
    }
};

// 4. Get informasi kendala
const getInformasiKendala = async (req) => {
    try {
        const { penggunaId } = getMetadataInfo(req);
        return await dashboardRepo.getInformasiKendala(penggunaId);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil informasi kendala');
    }
};

// 5. Get presentase task per projek
const getPresentasetask = async (req) => {
    try {
        const { penggunaId } = getMetadataInfo(req);
        return await dashboardRepo.getPresentasetask(penggunaId);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil data penyelesaian task per projek');
    }
};

// 6. Get total task status counts
const getTotalTaskStatus = async (req) => {
    try {
        const { penggunaId } = getMetadataInfo(req);
        return await dashboardRepo.getTotalTaskStatus(penggunaId);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil data statistik task');
    }
};

// DASHBOARD ATASAN
// 1. Get total reports from subordinates
const getTotalLaporanBawahan = async (req) => {
    try {
        const { jabatanId } = getMetadataInfo(req);
        const idJabatanParent = req.query.id_jabatan_parent || null;
        return await dashboardRepo.getTotalLaporanBawahan(jabatanId, idJabatanParent);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil data total laporan bawahan');
    }
};

// 2. Get list of subordinates with statistics
const getDaftarBawahan = async (req) => {
    try {
        const { jabatanId } = getMetadataInfo(req);
        const idJabatanParent = req.query.id_jabatan_parent || null;
        return await dashboardRepo.getDaftarBawahan(jabatanId, idJabatanParent);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil daftar bawahan dengan statistik');
    }
};

// 3. Get informasi projek yang dibuat oleh atasan
// const getInformasiProjek = async (req) => {
//     try {
//         const { penggunaId } = getMetadataInfo(req);
//         return await dashboardRepo.getInformasiProjek(penggunaId);
//     } catch (error) {
//         console.error(error);
//         throw new ErrorQueryException('Gagal mengambil informasi projek atasan');
//     }
// };

const getInformasiProjek = async (req, penggunaIdParam = null) => {
    try {
        const { penggunaId } = getMetadataInfo(req);
        const id = penggunaIdParam || penggunaId;
        return await dashboardRepo.getInformasiProjek(id);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil informasi projek atasan');
    }
};

// DASHBOARD DIREKTUR
// 1. Get daftar atasan (bawahan direktur) dengan statistik laporan
const getDaftarAtasan = async (req) => {
    try {
        const { jabatanId } = getMetadataInfo(req);
        return await dashboardRepo.getDaftarAtasan(jabatanId);
    } catch (error) {
        console.error(error);
        throw new ErrorQueryException('Gagal mengambil daftar atasan dengan statistik laporan');
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

    getDaftarAtasan

};