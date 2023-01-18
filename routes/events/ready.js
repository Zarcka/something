const { ActivityType } = require("discord.js");
const setPresence = require("../components/setPresence");

module.exports.run = async (client) => {
   console.clear();
   console.log(`${client.user.username} is ready`);
   new setPresence.default(client, [{
         content: `with Ash's art`,
         type: ActivityType.Playing,
         status: "idle",
      },
      {
         content: `#owners-gallery`,
         type: ActivityType.Watching,
         status: "idle",
      },
      {
         content: `screepy and Zarcka suffer`,
         type: ActivityType.Watching,
         status: "idle",
      },
   ]);
}