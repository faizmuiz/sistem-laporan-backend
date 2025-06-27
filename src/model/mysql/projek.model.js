'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Projek extends Model {
        static associate(models) {
            this.belongsTo(models.pengguna, {
                foreignKey: 'id_pengguna',
                as: 'pengguna',
            });
            this.hasMany(models.laporan_harian, {
                foreignKey: 'id_projek',
                as: 'laporan_harian',
            });
            this.hasMany(models.task, {
                foreignKey: 'id_projek',
                as: 'task',
            });
        }
    }

    Projek.init(
        {
            id_projek: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            projek: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            id_pengguna: {
                type: DataTypes.CHAR(36),
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            status_projek: {
                type: DataTypes.TINYINT(2),
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'projek',
            tableName: 'projek',
            timestamps: false, 
        }
    );

    return Projek;
};