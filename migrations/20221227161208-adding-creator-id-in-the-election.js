'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Elections", "creatorID", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Elections", {
      fields: ["creatorID"],
      type: "foreign key",
      references: {
        table: "Creators",
        field: "id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Elections", "creatorID");
  }
};
