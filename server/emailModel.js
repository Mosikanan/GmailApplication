const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const User = require('./userModel');

const Email = sequelize.define('Email', {
    emailId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    senderEmail: DataTypes.STRING,
    senderName: DataTypes.STRING,
    subject: DataTypes.TEXT,
    timestamp: DataTypes.DATE,
    snippet: DataTypes.TEXT,
});

Email.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = Email;
