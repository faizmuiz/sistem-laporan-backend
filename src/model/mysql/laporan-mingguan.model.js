'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LaporanMingguan extends Model {
        static associate(models) {
            this.belongsTo(models.laporan_harian, {
                foreignKey: 'id_laporan',
                as: 'laporan_harian',
            });
            this.belongsTo(models.pengguna, {
                foreignKey: 'id_pengguna',
                as: 'pengguna',
            });
            this.hasMany(models.laporan_mingguan_detail, {
                foreignKey: 'id_laporan_mingguan',
                as: 'detail_laporan_mingguan',
            });
        }
    }

    LaporanMingguan.init(
        {
            id_laporan_mingguan: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            // id_laporan: {
            //     type: DataTypes.CHAR(36),
            //     allowNull: true,
            // },
            id_pengguna: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            judul: {
                type: DataTypes.STRING(36),
                allowNull: true,
            },
            periode_awal: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            periode_akhir: {
                type: DataTypes.DATEONLY,
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
        },
        {
            sequelize,
            modelName: 'laporan_mingguan',
            tableName: 'laporan_mingguan',
            timestamps: false,
        }
    );

    return LaporanMingguan;
};