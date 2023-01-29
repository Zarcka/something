import setPresence from "../components/setPresence";
import ClientEvent from "../components/ClientEvent";
import { ActivityType } from "discord.js";

export default new ClientEvent("ready", async (client) => {
   console.clear();
   console.log(`${client.user.username} is ready`);
   new setPresence(client, [{
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
});