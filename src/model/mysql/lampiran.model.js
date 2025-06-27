'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Lampiran extends Model {
        static associate(models) {
            this.belongsTo(models.laporan_harian, {
                foreignKey: 'id_laporan',
                as: 'laporan_harian',
            });
        }
    }

    Lampiran.init(
        {
            id_lampiran: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            id_laporan: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            nama_lampiran: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            lampiran_label: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status_lampiran: {
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
        },
        {
            sequelize,
            modelName: 'lampiran',
            tableName: 'lampiran',
            timestamps: false,
        }
    );

    return Lampiran;
};