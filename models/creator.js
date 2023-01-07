'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Creator extends Model {
    static associate(models) {
      Creator.hasMany(models.Election, {
        foreignKey: "creatorID",
      });
    }
    static addCreator({ firstName, lastName, email, password }) {
      return this.create({
        firstName,
        lastName,
        email,
        password,
      });
    }
    static async getCreatorId(email) {
      return await this.findAll({
        where: {
          email,
        }
      });
    }
  }
  Creator.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email:  {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "creator",
    },
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Creator',
  });
  return Creator;
};