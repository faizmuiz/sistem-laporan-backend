'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LaporanHarian extends Model {
        static associate(models) {
            this.belongsTo(models.pengguna, {
                foreignKey: 'id_pengguna',
                as: 'pengguna',
            });
            this.belongsTo(models.projek, {
                foreignKey: 'id_projek',
                as: 'projek',
            });
            this.hasMany(models.laporan_harian_detail, {
                foreignKey: 'id_laporan',
                as: 'detail_laporan',
            });
            this.hasMany(models.komentar, {
                foreignKey: 'id_laporan',
                as: 'komentar',
            });
            this.hasMany(models.lampiran, {
                foreignKey: 'id_laporan',
                as: 'lampiran',
            });
            this.hasMany(models.task, {
                foreignKey: 'id_laporan',
                as: 'task',
            });
        }
    }

    LaporanHarian.init(
        {
            id_laporan: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            id_pengguna: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            id_projek: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            judul: {
                type: DataTypes.STRING(36),
                allowNull: true,
            },
            status_laporan: {
                type: DataTypes.ENUM('draft', 'publish'),
                allowNull: true,
            },
            status: {
                type: DataTypes.TINYINT(2),
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            sudah_direview: {
                type: DataTypes.TINYINT(2),
                allowNull: true,
            },
            kendala_selesai: {
                type: DataTypes.TINYINT(2),
                allowNull: true,
            },            
        },
        {
            sequelize,
            modelName: 'laporan_harian',
            tableName: 'laporan_harian',
            timestamps: false,
        }
    );

    return LaporanHarian;
};