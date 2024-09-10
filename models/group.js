const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Group = sequelize.define("group", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  admin: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = Group;
