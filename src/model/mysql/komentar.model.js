'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Komentar extends Model {
        static associate(models) {
            this.belongsTo(models.pengguna, {
                foreignKey: 'id_pengguna',
                as: 'pengguna',
            });
            this.belongsTo(models.laporan_harian, {
                foreignKey: 'id_laporan',
                as: 'laporan_harian',
            });
            this.belongsTo(models.komentar, {
                foreignKey: 'id_balas',
                as: 'balasan',
            });
        }
    }

    Komentar.init(
        {
            id_komentar: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            id_pengguna: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            id_laporan: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            id_balas: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            komentar: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status_komentar: {
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
            modelName: 'komentar',
            tableName: 'komentar',
            timestamps: false,
        }
    );

    return Komentar;
};