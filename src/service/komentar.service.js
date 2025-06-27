// library
const { v7: uuidv7 } = require('uuid');

// exception
const ErrorNotFoundException = require('../../exception/error-not-found.exception').ErrorNotFoundException;
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const { getMetadataInfo } = require('../../utility/metadata-info.utility');

// db
const db = require('../../database/mysql.connection'); 

// repo
const komentarRepo = require('../repository/komentar.repository');

// create
const createKomentar = async (req) => {
    const transaction = await db.sequelize.transaction();

    try {
        const body = req.body;
        const { currentDatetime, penggunaId } = getMetadataInfo(req);

        const payload = {
            id_komentar: uuidv7(),
            id_laporan: body.id_laporan,
            id_balas: body.id_balas || null,
            id_pengguna: penggunaId,
            komentar: body.komentar,
            status_komentar: 1,
            created_at: currentDatetime,
            updated_at: currentDatetime,
        };

        const newKomentar = await komentarRepo.createKomentar(payload, transaction);
        await transaction.commit();
        
        return newKomentar;
    } catch (error) {
        await transaction.rollback();
        throw new ErrorQueryException('Gagal membuat komentar', error);
    }
};

// get komentar by laporan id   
const getKomentarByLaporanId = async (req) => {
    const { laporanId } = req.params;

    try {
        const komentarList = await komentarRepo.getKomentarByLaporanId(laporanId);
        if (!komentarList) {
            throw new ErrorNotFoundException('Komentar tidak ditemukan');
        }
        return komentarList;
    } catch (error) {
        throw new ErrorQueryException('Gagal mendapatkan komentar', error);
    }
};

// export module
module.exports = {
    createKomentar,
    getKomentarByLaporanId,
};