'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Pengguna extends Model {
        static associate(models) {
            this.belongsTo(models.jabatan, {
                foreignKey: 'id_jabatan',
                as: 'jabatan',
            });
            this.hasMany(models.laporan_harian, {
                foreignKey: 'id_pengguna',
                as: 'laporan_harian',
            });
            this.hasMany(models.komentar, {
                foreignKey: 'id_pengguna',
                as: 'komentar',
            });
            this.hasMany(models.projek, {
                foreignKey: 'id_pengguna',
                as: 'projek',
            });
            this.hasMany(models.task, {
                foreignKey: 'id_target',
                as: 'task',
            });
        }
    }

    Pengguna.init(
        {
            id_pengguna: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            nama: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            id_jabatan: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING(60),
                allowNull: true,
            },
            telepon: {
                type: DataTypes.STRING(12),
                allowNull: true,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            // nama_file: {
            //     type: DataTypes.TEXT,
            //     allowNull: true,
            // },
            // label_file: {
            //     type: DataTypes.TEXT,
            //     allowNull: true,
            // },
            status_pengguna: {
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
            modelName: 'pengguna',
            tableName: 'pengguna',
            timestamps: false,
        }
    );

    return Pengguna;
};