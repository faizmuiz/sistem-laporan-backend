'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Autentikasi extends Model {
        static associate(models) {
            // Tidak ada relasi yang didefinisikan di sini
        }
    }

    Autentikasi.init(
        {
            id_auth: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            otp: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },
            requested_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            expired_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            otp_status: {
                type: DataTypes.TINYINT(1),
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'autentikasi',
            tableName: 'autentikasi',
            timestamps: false,
        }
    );

    return Autentikasi;
};