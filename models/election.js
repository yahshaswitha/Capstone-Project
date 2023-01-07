'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    static associate(models) {
      Election.belongsTo(models.Creator, {
        foreignKey: "creatorID",
      });
    };
    static GetElections(creatorID) {
      return this.findAll({
        where: {
          creatorID,
        },
        order: [["id", "ASC"]],
      });
    };
  }
  Election.init({
    name:{
      type: DataTypes.STRING,
      allowNull:false
    },
    customurl:{
      type: DataTypes.STRING,
      allowNull:false,
      unique:true
    },
    launched: {
      type:DataTypes.BOOLEAN,
      defaultValue:false
    },
    completed: {
      type:DataTypes.BOOLEAN,
      defaultValue:false
    }
  }, {
    sequelize,
    modelName: 'Election',
  });
  return Election;
};