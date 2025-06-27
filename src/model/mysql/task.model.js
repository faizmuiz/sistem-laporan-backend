'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Task extends Model {
        static associate(models) {
            this.belongsTo(models.projek, {
                foreignKey: 'id_projek',
                as: 'projek',
            });
            this.belongsTo(models.laporan_harian, {
                foreignKey: 'id_laporan',
                as: 'laporan_harian',
            });
            this.belongsTo(models.pengguna, {
                foreignKey: 'id_target',
                as: 'pengguna',
            });
        }
    }

    Task.init(
        {
            id_task: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            id_projek: {
                type: DataTypes.CHAR(36),
                allowNull: false,
            },
            id_laporan: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            id_target: {
                type: DataTypes.CHAR(36),
                allowNull: false,
            },
            task: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            status_selesai: {
                type: DataTypes.TINYINT(2),
                allowNull: true,
            },
            status_task: {
                type: DataTypes.TINYINT(2),
                allowNull: true,
            },
            bobot: {
                type: DataTypes.TINYINT(2),
                allowNull: true,
            },
            deadline: {
                type: DataTypes.DATE,
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
            modelName: 'task',
            tableName: 'task',
            timestamps: false,
        }
    );

    return Task;
};