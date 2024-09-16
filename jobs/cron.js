const { CronJob } = require("cron");
const Sequelize = require("sequelize");
const Message = require("../models/message");
const ArchivedChats = require("../models/archivedChats");

const job = new CronJob("0 0 * * *", async function () {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const messages = await Message.findAll({
      where: {
        createdAt: {
          [Sequelize.Op.lt]: oneDayAgo,
        },
      },
    });
    console.log("message>>:", messages);

    await ArchivedChats.bulkCreate(
      messages.map((message) => ({
        id: message.id,
        name: message.name,
        content: message.content,
        userId: message.userId,
        groupId: message.groupId,
      }))
    );

    await Message.destroy({
      where: {
        createdAt: {
          [Sequelize.Op.lt]: oneDayAgo,
        },
      },
    });

    console.log("Messages archived and deleted successfully.");
  } catch (err) {
    console.error("Error in archiving and deleting messages:", err);
  }
});

module.exports = job;
