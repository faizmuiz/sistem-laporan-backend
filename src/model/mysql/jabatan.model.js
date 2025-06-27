'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Jabatan extends Model {
        static associate(models) {
            this.belongsTo(models.jabatan, {
                foreignKey: 'parent',
                as: 'parent_jabatan',
            });
            this.hasMany(models.pengguna, {
                foreignKey: 'id_jabatan',
                as: 'pengguna',
            });
        }
    }

    Jabatan.init(
        {
            id_jabatan: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            jabatan: {
                type: DataTypes.STRING(36),
                allowNull: true,
            },
            divisi: {
                type: DataTypes.STRING(36),
                allowNull: true,
            },
            parent: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            level: {
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
            modelName: 'jabatan',
            tableName: 'jabatan',
            timestamps: false,
        }
    );

    return Jabatan;
};