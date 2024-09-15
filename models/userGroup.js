const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const UserGroup = sequelize.define("userGroup", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  isadmin: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
});

module.exports = UserGroup;
