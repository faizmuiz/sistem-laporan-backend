'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LaporanHarianDetail extends Model {
        static associate(models) {
            this.belongsTo(models.laporan_harian, {
                foreignKey: 'id_laporan',
                as: 'laporan_harian',
            });
        }
    }

    LaporanHarianDetail.init(
        {
            id_harian_detail: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            id_laporan: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            konten: {
                type: DataTypes.ENUM('selesai', 'kendala', 'rencana', ''),
                allowNull: true,
            },
            isi_konten: {
                type: DataTypes.TEXT,
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
            modelName: 'laporan_harian_detail',
            tableName: 'laporan_harian_detail',
            timestamps: false,
        }
    );

    return LaporanHarianDetail;
};