// library
const moment = require('moment');

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

// model
const db = require('../../database/mysql.connection');
const komentar = db.komentar;
const pengguna = db.pengguna;
const jabatan = db.jabatan;

// create
const createKomentar = async (payload, transaction = null) => {
    try {
        const config = {transaction};
        return await komentar.create(payload, config);
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// get komentar by laporan id
const getKomentarByLaporanId = async (laporanId) => {
    try {
        const komentarList = await komentar.findAll({
            where: { id_laporan: laporanId },
            include: [
                {
                    model: pengguna,
                    as: 'pengguna',
                    attributes: ['id_pengguna', 'nama'],
                    include: [
                        {
                            model: jabatan,
                            as: 'jabatan',
                            attributes: ['id_jabatan', 'jabatan'],
                        },
                    ],
                },
            ],
            order: [['created_at', 'ASC']]
        });

        // Format data komentar
        const formattedKomentar = komentarList.map((data) => ({
            id_komentar: data.id_komentar,
            id_laporan: data.id_laporan,
            nama: data.pengguna.nama,
            jabatan: data.pengguna.jabatan.jabatan,
            id_balas: data.id_balas || null,
            komentar: data.komentar,
            created_at: moment(data.created_at).format('YYYY-MM-DD HH:mm:ss'),
        }));

        // Pisahkan komentar utama dan balasan
        const mainComments = formattedKomentar.filter(comment => !comment.id_balas);
        const replies = formattedKomentar.filter(comment => comment.id_balas);

        // Susun komentar dengan balasan di bawah komentar yang dibalas
        const sortedComments = [];
        
        mainComments.forEach(mainComment => {
            // Tambahkan komentar utama
            sortedComments.push(mainComment);
            
            // Cari semua balasan untuk komentar ini
            const commentReplies = replies.filter(reply => reply.id_balas === mainComment.id_komentar);
            
            // Urutkan balasan berdasarkan waktu
            commentReplies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            // Tambahkan balasan setelah komentar utama
            sortedComments.push(...commentReplies);
        });

        return sortedComments;
    } catch (error) {
        const errorObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errorObj.metaData.message.errorObj);
    }
};

// export module
module.exports = {
    createKomentar,
    getKomentarByLaporanId,

};