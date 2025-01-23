const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const User = require('./userModel');

const Email = sequelize.define('Email', {
    emailId: DataTypes.STRING,
    senderEmail: DataTypes.STRING,
    senderName: DataTypes.STRING,
    subject: DataTypes.TEXT,
    timestamp: DataTypes.STRING,
    snippet: DataTypes.TEXT,
});

Email.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = Email;
