'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LaporanMingguanDetail extends Model {
        static associate(models) {
            this.belongsTo(models.laporan_mingguan, {
                foreignKey: 'id_laporan_mingguan',
                as: 'laporan_mingguan',
            });
            this.belongsTo(models.laporan_harian, {
                foreignKey: 'id_laporan',
                as: 'laporan_harian',
            });
            this.belongsTo(models.laporan_harian_detail, {
                foreignKey: 'id_harian_detail',
                as: 'laporan_harian_detail',
            });
        }
    }

    LaporanMingguanDetail.init(
        {
            id_mingguan_detail: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            id_laporan_mingguan: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            id_laporan: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            id_harian_detail: {
                type: DataTypes.CHAR(36),
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
            modelName: 'laporan_mingguan_detail',
            tableName: 'laporan_mingguan_detail',
            timestamps: false,
        }
    );

    return LaporanMingguanDetail;
};