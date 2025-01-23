const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
    googleId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: DataTypes.STRING,
    accessToken: DataTypes.TEXT,
    refreshToken: DataTypes.TEXT,
});

module.exports = User;
