// library
const { Op } = require('sequelize');

// exception
const ErrorQueryException = require('../../exception/error-query.exception').ErrorQueryException;

// utility
const errorFormat = require('../../utility/error-format');

//model
const db = require('../../database/mysql.connection');
const pengguna = db.pengguna;
const jabatan = db.jabatan;
const laporanHarian = db.laporan_harian;
const laporanHarianDetail = db.laporan_harian_detail;
const laporanMingguan = db.laporan_mingguan;
const laporanMingguanDetail = db.laporan_mingguan_detail;
const komentar = db.komentar;
const lampiran = db.lampiran;
const projek = db.projek;
const task = db.task;

// DASHBOARD KARYAWAN

// 1. Get total laporan, sudah review, dan belum review
const getTotalLaporanDanReview = async (penggunaId) => {
    try {
        const [totalLaporan, sudahReview, belumReview] = await Promise.all([
            laporanHarian.count({
                where: {
                    id_pengguna: penggunaId,
                    status: { [Op.ne]: 0 },
                    status_laporan: { [Op.ne]: 'draft' }
                }
            }),
            laporanHarian.count({
                where: {
                    id_pengguna: penggunaId,
                    sudah_direview: 1,
                    status: { [Op.ne]: 0 },
                    status_laporan: { [Op.ne]: 'draft' }
                }
            }),
            laporanHarian.count({
                where: {
                    id_pengguna: penggunaId,
                    sudah_direview: 0,
                    status: { [Op.ne]: 0 },
                    status_laporan: { [Op.ne]: 'draft' }
                }
            })
        ]);

        return {
            total_laporan: totalLaporan,
            sudah_review: sudahReview,
            belum_review: belumReview
        };
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// 2. Get status laporan (draft dan publish)
const getStatusLaporan = async (penggunaId) => {
    try {
        const [draft, publish] = await Promise.all([
            laporanHarian.count({
                where: {
                    id_pengguna: penggunaId,
                    status_laporan: 'draft',
                    status: { [Op.ne]: 0 }
                }
            }),
            laporanHarian.count({
                where: {
                    id_pengguna: penggunaId,
                    status_laporan: 'publish',
                    status: { [Op.ne]: 0 }
                }
            })
        ]);

        return {
            draft,
            publish,
            total: draft + publish
        };
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// 3. Get list kendala
const getListKendala = async (penggunaId) => {
    try {
        const kendala = await laporanHarian.findAll({
            where: {
                id_pengguna: penggunaId,
                kendala_selesai: 0, // Hanya yang memiliki kendala
                status: { [Op.ne]: 0 },
                status_laporan: { [Op.ne]: 'draft' }
            },
            include: [
                {
                    model: laporanHarianDetail,
                    as: 'detail_laporan',
                    where: { konten: 'kendala' },
                    attributes: ['isi_konten'],
                    required: false
                },
                {
                    model: db.projek,
                    as: 'projek',
                    attributes: ['projek']
                }
            ],
            order: [['created_at', 'DESC']],
            attributes: ['id_laporan', 'judul', 'kendala_selesai', 'created_at']
        });

        return kendala.map(item => ({
            id_laporan: item.id_laporan,
            judul: item.judul,
            kendala: item.detail_laporan.length > 0 ? item.detail_laporan[0].isi_konten : '-',
            projek: item.projek?.projek || '-',
            status_kendala: item.kendala_selesai === 0 ? 'Belum Selesai' : 'Selesai',
            tanggal: item.created_at
        }));
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// 4. Get informasi kendala (total tidak ada, belum, dan ada)
const getInformasiKendala = async (penggunaId) => {
    try {
        const results = await laporanHarian.findAll({
            attributes: [
                [db.Sequelize.literal('COALESCE(kendala_selesai, -1)'), 'kendala_status'],
                [db.Sequelize.fn('COUNT', '*'), 'total']
            ],
            where: {
                id_pengguna: penggunaId,
                status: { [Op.ne]: 0 },
                status_laporan: { [Op.ne]: 'draft' }
            },
            group: [db.Sequelize.literal('COALESCE(kendala_selesai, -1)')]
        });

        const data = {
            tidak_ada: 0,
            belum_selesai: 0,
            sudah_selesai: 0
        };

        results.forEach(item => {
            const status = parseInt(item.dataValues.kendala_status, 10);
            const count = parseInt(item.dataValues.total, 10);
            
            if (status === -1) data.tidak_ada = count;
            else if (status === 0) data.belum_selesai = count;
            else if (status === 1) data.sudah_selesai = count;
        });

        return data;
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// 5. Get presentase task selesai (modifikasi untuk menghitung berdasarkan bobot)
const getPresentasetask = async (penggunaId) => {
    try {
        // First get all projects the employee has tasks in
        const projects = await task.findAll({
            where: {
                id_target: penggunaId,
                status_task: { [Op.ne]: 0 }
            },
            attributes: ['id_projek'],
            include: [{
                model: db.projek,
                as: 'projek',
                attributes: ['projek']
            }],
            distinct: true,
            raw: true
        });

        if (projects.length === 0) return [];

        const uniqueProjects = [];
        const seenProjects = new Set();
        
        for (const project of projects) {
            if (!seenProjects.has(project.id_projek)) {
                seenProjects.add(project.id_projek);
                uniqueProjects.push(project);
            }
        }

        // Get task statistics for each unique project with bobot calculation
        const projectIds = uniqueProjects.map(p => p.id_projek);
        const taskStats = await task.findAll({
            where: {
                id_target: penggunaId,
                id_projek: { [Op.in]: projectIds },
                status_task: { [Op.ne]: 0 }
            },
            attributes: [
                'id_projek',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id_task')), 'total_task'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('bobot')), 'total_bobot'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN bobot ELSE 0 END)'), 'bobot_belum'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN bobot ELSE 0 END)'), 'bobot_berjalan'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN bobot ELSE 0 END)'), 'bobot_kendala'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN bobot ELSE 0 END)'), 'bobot_selesai'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN 1 ELSE 0 END)'), 'belum'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN 1 ELSE 0 END)'), 'berjalan'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN 1 ELSE 0 END)'), 'kendala'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN 1 ELSE 0 END)'), 'selesai']
            ],
            group: ['id_projek'],
            raw: true
        });

        // Combine project info with task stats
        return uniqueProjects.map(project => {
            const stats = taskStats.find(stat => stat.id_projek === project.id_projek) || {
                total_task: 0,
                total_bobot: 0,
                bobot_belum: 0,
                bobot_berjalan: 0,
                bobot_kendala: 0,
                bobot_selesai: 0,
                belum: 0,
                berjalan: 0,
                kendala: 0,
                selesai: 0
            };

            const totalBobot = parseInt(stats.total_bobot) || 1; 
            const bobotSelesai = parseInt(stats.bobot_selesai);
            const bobotBelum = parseInt(stats.bobot_belum) + parseInt(stats.bobot_berjalan) + parseInt(stats.bobot_kendala);

            return {
                id_projek: project.id_projek,
                nama_projek: project['projek.projek'] || '-',
                total_task: parseInt(stats.total_task),
                total_bobot: totalBobot,
                bobot_selesai: bobotSelesai,
                bobot_belum: bobotBelum,
                persentase_selesai: Math.round((bobotSelesai / totalBobot) * 100),
                persentase_belum: Math.round((bobotBelum / totalBobot) * 100),
                detail_status: {
                    selesai: parseInt(stats.selesai) || 0,
                    belum_detail: {
                        belum: parseInt(stats.belum) || 0,
                        berjalan: parseInt(stats.berjalan) || 0,
                        kendala: parseInt(stats.kendala) || 0
                    }
                }
            };
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// 6. Get total task status counts (modifikasi untuk menghitung berdasarkan bobot)
const getTotalTaskStatus = async (penggunaId) => {
    try {
        const results = await task.findAll({
            where: {
                id_target: penggunaId,
                status_task: { [Op.ne]: 0 }
            },
            attributes: [
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id_task')), 'total_task'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('bobot')), 'total_bobot'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN bobot ELSE 0 END)'), 'bobot_belum'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN bobot ELSE 0 END)'), 'bobot_berjalan'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN bobot ELSE 0 END)'), 'bobot_kendala'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN bobot ELSE 0 END)'), 'bobot_selesai'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN 1 ELSE 0 END)'), 'belum'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN 1 ELSE 0 END)'), 'berjalan'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN 1 ELSE 0 END)'), 'kendala'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN 1 ELSE 0 END)'), 'selesai']
            ],
            raw: true
        });

        const result = results[0] || {
            total_task: 0,
            total_bobot: 0,
            bobot_belum: 0,
            bobot_berjalan: 0,
            bobot_kendala: 0,
            bobot_selesai: 0,
            belum: 0,
            berjalan: 0,
            kendala: 0,
            selesai: 0
        };

        const totalBobot = parseInt(result.total_bobot) || 1; // Avoid division by zero
        const bobotSelesai = parseInt(result.bobot_selesai);
        const bobotBelum = parseInt(result.bobot_belum) + parseInt(result.bobot_berjalan) + parseInt(result.bobot_kendala);

        return {
            total_task: parseInt(result.total_task),
            total_bobot: totalBobot,
            bobot_selesai: bobotSelesai,
            bobot_belum: bobotBelum,
            persentase_selesai: Math.round((bobotSelesai / totalBobot) * 100),
            persentase_belum: Math.round((bobotBelum / totalBobot) * 100),
            detail_status: {
                selesai: parseInt(result.selesai) || 0,
                belum_detail: {
                    belum: parseInt(result.belum) || 0,
                    berjalan: parseInt(result.berjalan) || 0,
                    kendala: parseInt(result.kendala) || 0
                }
            }
        };
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// DASHBOARD ATASAN
// Helper function to get subordinates by position
async function getSemuaJabatanTurunan(idJabatanAtasan) {
    const jabatanTurunan = [];
    
    async function findTurunan(idParent) {
        const jabatanChild = await jabatan.findAll({
            where: { parent: idParent },
            attributes: ['id_jabatan'],
            raw: true
        });
        
        if (jabatanChild.length > 0) {
            for (const j of jabatanChild) {
                jabatanTurunan.push(j.id_jabatan);
                await findTurunan(j.id_jabatan); // Recursive call
            }
        }
    }
    
    await findTurunan(idJabatanAtasan);
    return jabatanTurunan;
}

const getBawahanPenggunaByJabatan = async (idJabatanAtasan, idJabatanParent = null, hanyaLangsung = false) => {
    let whereClauseJabatan = {};
    if (hanyaLangsung) {
        whereClauseJabatan = { parent: idJabatanAtasan };
    } else if (idJabatanParent) {
        whereClauseJabatan = { parent: idJabatanParent };
    } else {
        // Cari semua bawahan di semua level di bawah jabatan atasan
        const semuaJabatanBawahan = await jabatan.findAll({
            where: {
                [Op.or]: [
                    { parent: idJabatanAtasan },
                    { parent: { [Op.in]: await getSemuaJabatanTurunan(idJabatanAtasan) } }
                ]
            },
            attributes: ['id_jabatan'],
            raw: true
        });
        
        whereClauseJabatan = { id_jabatan: { [Op.in]: semuaJabatanBawahan.map(j => j.id_jabatan) } };
    }

    const semuaPengguna = await db.pengguna.findAll({
        include: [{
            model: db.jabatan,
            as: 'jabatan',
            where: whereClauseJabatan,
            required: true
        }],
        where: {
            status_pengguna: { [Op.ne]: 0 }
        },
        raw: true
    });

    return semuaPengguna.map(p => p.id_pengguna);
};

// 1. Get statistik laporan
const getTotalLaporanBawahan = async (idJabatanAtasan, idJabatanParent = null) => {
    try {
        const penggunaIds = await getBawahanPenggunaByJabatan(idJabatanAtasan, idJabatanParent);

        if (penggunaIds.length === 0) {
            return {
                total_laporan: 0,
                sudah_review: 0,
                belum_review: 0
            };
        }

        const [total, sudah, belum] = await Promise.all([
            db.laporan_harian.count({
                where: {
                    id_pengguna: { [Op.in]: penggunaIds },
                    status: { [Op.ne]: 0 },
                    status_laporan: { [Op.ne]: 'draft' }
                }
            }),
            db.laporan_harian.count({
                where: {
                    id_pengguna: { [Op.in]: penggunaIds },
                    sudah_direview: 1,
                    status: { [Op.ne]: 0 },
                    status_laporan: { [Op.ne]: 'draft' }
                }
            }),
            db.laporan_harian.count({
                where: {
                    id_pengguna: { [Op.in]: penggunaIds },
                    sudah_direview: 0,
                    status: { [Op.ne]: 0 },
                    status_laporan: { [Op.ne]: 'draft' }
                }
            })
        ]);

        return {
            total_laporan: total,
            sudah_review: sudah,
            belum_review: belum,
            persentase_sudah: total > 0 ? Math.round((sudah / total) * 100) : 0,
            persentase_belum: total > 0 ? Math.round((belum / total) * 100) : 0
        };
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// 2. Get list bawahan
// const getDaftarBawahan = async (idJabatanAtasan, idJabatanParent = null) => {
//     try {
//         // Get all subordinates
//         const bawahan = await db.pengguna.findAll({
//             include: [{
//                 model: db.jabatan,
//                 as: 'jabatan',
//                 where: idJabatanParent ? { parent: idJabatanParent } : { parent: idJabatanAtasan },
//                 required: true
//             }],
//             where: {
//                 status_pengguna: { [Op.ne]: 0 }
//             },
//             attributes: ['id_pengguna', 'nama']
//         });

//         if (bawahan.length === 0) return [];

//         const bawahanIds = bawahan.map(b => b.id_pengguna);

//         // Get report statistics for all subordinates
//         const reportStats = await laporanHarian.findAll({
//             where: {
//                 id_pengguna: { [Op.in]: bawahanIds },
//                 status: { [Op.ne]: 0 },
//                 status_laporan: { [Op.ne]: 'draft' }
//             },
//             attributes: [
//                 'id_pengguna',
//                 [db.Sequelize.fn('COUNT', db.Sequelize.col('id_laporan')), 'total_laporan'],
//                 [db.Sequelize.literal('SUM(CASE WHEN sudah_direview = 1 THEN 1 ELSE 0 END)'), 'sudah_review'],
//                 [db.Sequelize.literal('SUM(CASE WHEN sudah_direview = 0 THEN 1 ELSE 0 END)'), 'belum_review'],
//                 [db.Sequelize.literal('SUM(CASE WHEN kendala_selesai = 0 THEN 1 ELSE 0 END)'), 'total_kendala']
//             ],
//             group: ['id_pengguna'],
//             raw: true
//         });

//         // Get task statistics for all subordinates
//         const taskStats = await db.task.findAll({
//             where: {
//                 id_target: { [Op.in]: bawahanIds },
//                 status_task: { [Op.ne]: 0 }
//             },
//             attributes: [
//                 'id_target',
//                 [db.Sequelize.fn('COUNT', db.Sequelize.col('id_task')), 'total_task'],
//                 [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN 1 ELSE 0 END)'), 'belum'],
//                 [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN 1 ELSE 0 END)'), 'berjalan'],
//                 [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN 1 ELSE 0 END)'), 'kendala'],
//                 [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN 1 ELSE 0 END)'), 'selesai']
//             ],
//             group: ['id_target'],
//             raw: true
//         });

//         // Combine all data
//         return bawahan.map(b => {
//             const reportStat = reportStats.find(r => r.id_pengguna === b.id_pengguna) || {
//                 total_laporan: 0,
//                 sudah_review: 0,
//                 belum_review: 0,
//                 total_kendala: 0
//             };

//             const taskStat = taskStats.find(t => t.id_target === b.id_pengguna) || {
//                 total_task: 0,
//                 belum: 0,
//                 berjalan: 0,
//                 kendala: 0,
//                 selesai: 0
//             };

//             const totalTask = parseInt(taskStat.total_task);
//             const totalSelesai = parseInt(taskStat.selesai);
//             const totalBelum = parseInt(taskStat.belum) + parseInt(taskStat.berjalan) + parseInt(taskStat.kendala);

//             return {
//                 id_pengguna: b.id_pengguna,
//                 nama: b.nama,
//                 jabatan: b.jabatan.jabatan,
//                 laporan: {
//                     total: parseInt(reportStat.total_laporan) || 0,
//                     sudah_review: parseInt(reportStat.sudah_review) || 0,
//                     belum_review: parseInt(reportStat.belum_review) || 0,
//                     total_kendala: parseInt(reportStat.total_kendala) || 0,
//                     persentase_sudah: reportStat.total_laporan > 0 
//                         ? Math.round((reportStat.sudah_review / reportStat.total_laporan) * 100) 
//                         : 0,
//                     persentase_belum: reportStat.total_laporan > 0 
//                         ? Math.round((reportStat.belum_review / reportStat.total_laporan) * 100) 
//                         : 0
//                 },
//                 task: {
//                     total: totalTask,
//                     selesai: totalSelesai,
//                     belum: totalBelum,
//                     persentase_selesai: totalTask > 0 ? Math.round((totalSelesai / totalTask) * 100) : 0,
//                     persentase_belum: totalTask > 0 ? Math.round((totalBelum / totalTask) * 100) : 0,
//                     detail_status: {
//                         belum: parseInt(taskStat.belum) || 0,
//                         berjalan: parseInt(taskStat.berjalan) || 0,
//                         kendala: parseInt(taskStat.kendala) || 0,
//                         selesai: parseInt(taskStat.selesai) || 0
//                     }
//                 }
//             };
//         });
//     } catch (error) {
//         const errObj = await errorFormat.sequelizeDB(error);
//         throw new ErrorQueryException(errObj.metaData.message, errObj);
//     }
// };

const getDaftarBawahan = async (idJabatanAtasan, idJabatanParent = null) => {
    try {
        // Get all subordinates
        const bawahan = await db.pengguna.findAll({
            include: [{
                model: db.jabatan,
                as: 'jabatan',
                where: idJabatanParent ? { parent: idJabatanParent } : { parent: idJabatanAtasan },
                required: true
            }],
            where: {
                status_pengguna: { [Op.ne]: 0 }
            },
            attributes: ['id_pengguna', 'nama']
        });

        if (bawahan.length === 0) return [];

        const bawahanIds = bawahan.map(b => b.id_pengguna);

        // Get report statistics for all subordinates
        const reportStats = await laporanHarian.findAll({
            where: {
                id_pengguna: { [Op.in]: bawahanIds },
                status: { [Op.ne]: 0 },
                status_laporan: { [Op.ne]: 'draft' }
            },
            attributes: [
                'id_pengguna',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id_laporan')), 'total_laporan'],
                [db.Sequelize.literal('SUM(CASE WHEN sudah_direview = 1 THEN 1 ELSE 0 END)'), 'sudah_review'],
                [db.Sequelize.literal('SUM(CASE WHEN sudah_direview = 0 THEN 1 ELSE 0 END)'), 'belum_review'],
                [db.Sequelize.literal('SUM(CASE WHEN kendala_selesai = 0 THEN 1 ELSE 0 END)'), 'total_kendala']
            ],
            group: ['id_pengguna'],
            raw: true
        });

        // Get task statistics for all subordinates
        const taskStats = await db.task.findAll({
            where: {
                id_target: { [Op.in]: bawahanIds },
                status_task: { [Op.ne]: 0 }
            },
            attributes: [
                'id_target',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id_task')), 'total_task'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('bobot')), 'total_bobot'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN bobot ELSE 0 END)'), 'bobot_belum'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN bobot ELSE 0 END)'), 'bobot_berjalan'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN bobot ELSE 0 END)'), 'bobot_kendala'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN bobot ELSE 0 END)'), 'bobot_selesai'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN 1 ELSE 0 END)'), 'belum'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN 1 ELSE 0 END)'), 'berjalan'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN 1 ELSE 0 END)'), 'kendala'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN 1 ELSE 0 END)'), 'selesai']
            ],
            group: ['id_target'],
            raw: true
        });

        // Combine all data
        return bawahan.map(b => {
            const reportStat = reportStats.find(r => r.id_pengguna === b.id_pengguna) || {
                total_laporan: 0,
                sudah_review: 0,
                belum_review: 0,
                total_kendala: 0
            };

            const taskStat = taskStats.find(t => t.id_target === b.id_pengguna) || {
                total_task: 0,
                total_bobot: 0,
                bobot_belum: 0,
                bobot_berjalan: 0,
                bobot_kendala: 0,
                bobot_selesai: 0,
                belum: 0,
                berjalan: 0,
                kendala: 0,
                selesai: 0
            };

            const totalBobot = parseInt(taskStat.total_bobot) || 1;
            const bobotSelesai = parseInt(taskStat.bobot_selesai);
            const bobotBelum = parseInt(taskStat.bobot_belum) + parseInt(taskStat.bobot_berjalan) + parseInt(taskStat.bobot_kendala);
            
            return {
                id_pengguna: b.id_pengguna,
                nama: b.nama,
                jabatan: b.jabatan.jabatan,
                divisi: b.jabatan.divisi,
                laporan: {
                    total: parseInt(reportStat.total_laporan) || 0,
                    sudah_review: parseInt(reportStat.sudah_review) || 0,
                    belum_review: parseInt(reportStat.belum_review) || 0,
                    total_kendala: parseInt(reportStat.total_kendala) || 0,
                    persentase_sudah: reportStat.total_laporan > 0 
                        ? Math.round((reportStat.sudah_review / reportStat.total_laporan) * 100) 
                        : 0,
                    persentase_belum: reportStat.total_laporan > 0 
                        ? Math.round((reportStat.belum_review / reportStat.total_laporan) * 100) 
                        : 0
                },
                task: {
                    total_task: parseInt(taskStat.total_task),
                    total_bobot: totalBobot,
                    bobot_selesai: bobotSelesai,
                    bobot_belum: bobotBelum,
                    persentase_bobot_selesai: Math.round((bobotSelesai / totalBobot) * 100),
                    persentase_bobot_belum: Math.round((bobotBelum / totalBobot) * 100),
                    detail_status_task: {
                        belum: parseInt(taskStat.belum) || 0,
                        berjalan: parseInt(taskStat.berjalan) || 0,
                        kendala: parseInt(taskStat.kendala) || 0,
                        selesai: parseInt(taskStat.selesai) || 0
                    }
                }
            };
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// 3. Get informasi projek yang dibuat oleh atasan beserta statistik task
const getInformasiProjek = async (penggunaId) => {
    try {
        // First get all projects created by this supervisor
        const projects = await projek.findAll({
            where: {
                id_pengguna: penggunaId,
                status_projek: { [Op.ne]: 0 }
            },
            attributes: ['id_projek', 'projek',],
            raw: true
        });

        if (projects.length === 0) return [];

        const projectIds = projects.map(p => p.id_projek);

        // Get task statistics for each project
        const taskStats = await task.findAll({
            where: {
                id_projek: { [Op.in]: projectIds },
                status_task: { [Op.ne]: 0 }
            },
            attributes: [
                'id_projek',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id_task')), 'total_task'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('bobot')), 'total_bobot'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN bobot ELSE 0 END)'), 'bobot_belum'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN bobot ELSE 0 END)'), 'bobot_berjalan'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN bobot ELSE 0 END)'), 'bobot_kendala'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN bobot ELSE 0 END)'), 'bobot_selesai'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 0 THEN 1 ELSE 0 END)'), 'belum'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 1 THEN 1 ELSE 0 END)'), 'berjalan'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 2 THEN 1 ELSE 0 END)'), 'kendala'],
                [db.Sequelize.literal('SUM(CASE WHEN status_selesai = 3 THEN 1 ELSE 0 END)'), 'selesai']
            ],
            group: ['id_projek'],
            raw: true
        });

        // Combine project info with task stats
        return projects.map(project => {
            const stats = taskStats.find(stat => stat.id_projek === project.id_projek) || {
                total_task: 0,
                total_bobot: 0,
                bobot_belum: 0,
                bobot_berjalan: 0,
                bobot_kendala: 0,
                bobot_selesai: 0,
                belum: 0,
                berjalan: 0,
                kendala: 0,
                selesai: 0
            };

            const totalBobot = parseInt(stats.total_bobot) || 1;
            const bobotSelesai = parseInt(stats.bobot_selesai);
            const bobotBelum = parseInt(stats.bobot_belum) + parseInt(stats.bobot_berjalan) + parseInt(stats.bobot_kendala);

            return {
                id_projek: project.id_projek,
                nama_projek: project.projek,
                total_task: parseInt(stats.total_task),
                total_bobot: totalBobot,
                bobot_selesai: bobotSelesai,
                bobot_belum: bobotBelum,
                persentase_bobot_selesai: Math.round((bobotSelesai / totalBobot) * 100),
                persentase_bobot_belum: Math.round((bobotBelum / totalBobot) * 100),
                detail_status_task: {
                    selesai: parseInt(stats.selesai) || 0,
                    belum: parseInt(stats.belum) || 0,
                    berjalan: parseInt(stats.berjalan) || 0,
                    kendala: parseInt(stats.kendala) || 0
                }
            };
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
    }
};

// DASHBOARD DIREKTUR
// 1. Get daftar atasan (bawahan direktur) dengan statistik laporan
const getDaftarAtasan = async (idJabatanDirektur) => {
    try {
        // Get all positions that report directly to the director
        const jabatanAtasan = await jabatan.findAll({
            where: {
                parent: idJabatanDirektur
            },
            attributes: ['id_jabatan'],
            raw: true
        });

        if (jabatanAtasan.length === 0) return [];

        const jabatanIds = jabatanAtasan.map(j => j.id_jabatan);

        // Get all supervisors in these positions
        const atasan = await pengguna.findAll({
            include: [{
                model: jabatan,
                as: 'jabatan',
                where: { id_jabatan: { [Op.in]: jabatanIds } },
                required: true
            }],
            where: {
                status_pengguna: { [Op.ne]: 0 }
            },
            attributes: ['id_pengguna', 'nama', 'id_jabatan'],
            raw: true
        });

        if (atasan.length === 0) return [];

        // Get report statistics for each supervisor's subordinates
        const reportStats = await Promise.all(atasan.map(async (a) => {
            // Get all subordinates under this supervisor
            const bawahanIds = await getBawahanPenggunaByJabatan(a.id_jabatan);
            
            if (bawahanIds.length === 0) {
                return {
                    id_pengguna: a.id_pengguna,
                    total_laporan: 0,
                    sudah_review: 0,
                    belum_review: 0,
                    total_kendala: 0
                };
            }

            const stats = await laporanHarian.findAll({
                where: {
                    id_pengguna: { [Op.in]: bawahanIds },
                    status: { [Op.ne]: 0 },
                    status_laporan: { [Op.ne]: 'draft' }
                },
                attributes: [
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id_laporan')), 'total_laporan'],
                    [db.Sequelize.literal('SUM(CASE WHEN sudah_direview = 1 THEN 1 ELSE 0 END)'), 'sudah_review'],
                    [db.Sequelize.literal('SUM(CASE WHEN sudah_direview = 0 THEN 1 ELSE 0 END)'), 'belum_review'],
                    [db.Sequelize.literal('SUM(CASE WHEN kendala_selesai = 0 THEN 1 ELSE 0 END)'), 'total_kendala']
                ],
                raw: true
            });

            return {
                id_pengguna: a.id_pengguna,
                total_laporan: stats[0]?.total_laporan || 0,
                sudah_review: stats[0]?.sudah_review || 0,
                belum_review: stats[0]?.belum_review || 0,
                total_kendala: stats[0]?.total_kendala || 0
            };
        }));

        // Combine all data
        return atasan.map(a => {
            const stats = reportStats.find(r => r.id_pengguna === a.id_pengguna) || {
                total_laporan: 0,
                sudah_review: 0,
                belum_review: 0,
                total_kendala: 0
            };

            return {
                id_pengguna: a.id_pengguna,
                nama: a.nama,
                jabatan: a['jabatan.jabatan'] || '-',
                total_laporan: parseInt(stats.total_laporan) || 0,
                sudah_review: parseInt(stats.sudah_review) || 0,
                belum_review: parseInt(stats.belum_review) || 0,
                total_kendala: parseInt(stats.total_kendala) || 0,
                persentase_sudah: stats.total_laporan > 0 
                    ? Math.round((stats.sudah_review / stats.total_laporan) * 100) 
                    : 0,
                persentase_belum: stats.total_laporan > 0 
                    ? Math.round((stats.belum_review / stats.total_laporan) * 100) 
                    : 0
            };
        });
    } catch (error) {
        const errObj = await errorFormat.sequelizeDB(error);
        throw new ErrorQueryException(errObj.metaData.message, errObj);
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

    getBawahanPenggunaByJabatan,
    getTotalLaporanBawahan,
    getDaftarBawahan,
    getInformasiProjek,

    getDaftarAtasan
};