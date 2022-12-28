const { Intents, Client } = require("discord.js");
const config = require("../config");
const fs = require("fs");
const upload = require("../models/upload");
const { timeConverter } = require("../functions/timeconverter")
const client = new Client({
   intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_MESSAGES,
   ],
});

try {
   client.on("ready", async () => {
      console.log("bot is ready");
      client.user.setPresence({
         activities: [
            {
               name: "#❣-ashes-art-corner",
               type: "WATCHING"
            },
         ],
         status: "online",
      }); 
   });

   const processAttachments = async (messages) => {
      const attachments = [];
      messages.forEach((message) => {
         const attach = Array.from(message.attachments.values()).map(({url}) => url);
         const desc = message.content;
         const date = timeConverter(message.createdTimestamp);
         const uploaded_by = `${message.author.username}#${message.author.discriminator}`;
         const reactions = Array.from(message.reactions.cache.values()).map(({ _emoji }) => {
            return {
               name: _emoji.name,
               id: _emoji.id || null,
               count: _emoji.reaction.count
            }
         });
         attachments.push({
            desc,
            date,
            uploaded_by,
            attach,
            reactions
         });
      });
      attachments.reverse();
      for (let i = 1; i < attachments.length; i++) {
         if (attachments[i].date === attachments[i - 1].date) {
            attachments[i - 1].desc += `\n\n${attachments[i].desc}`;
            attachments[i - 1].attach = attachments[i - 1].attach.concat(attachments[i].attach);
            attachments.splice(i, 1);
            i--;
         }
      }
      return attachments;
   };
   
   const updateAttachments = async (guildId, channelId) => {
      upload.find({}, async function (err, docs) {
         const guild = client.guilds.cache.get(guildId);
         const channel = await guild.channels.fetch(channelId);
         const messages = await channel.messages.fetch();
         const attachments = await processAttachments(messages);
         const old = JSON.parse(fs.readFileSync("./models/attachments.json"));
         const newAttachments = attachments.filter((a) => {
            for (const prop in a) {
               if (old.some((o) => o[prop] === a[prop])) {
               return false;
               }
            }
            return true;
         });
         const newAttach = old.concat(newAttachments);
         const filtered = newAttach.filter((a) => {
            for (const prop in a) {
               if (docs.some((o) => o[prop] === a[prop])) {
                  return false;
               }
            }
            return true;
         });       
         if (filtered.length > 0) {
            filtered.forEach(async (a) => {
               await upload.create({
                  desc: a.desc,
                  date: a.date,
                  uploaded_by: a.uploaded_by,
                  attach: a.attach,
                  reactions: a.reactions,
               });
            });
         } else {
            return;
         }
         fs.writeFileSync("./models/attachments.json", JSON.stringify(newAttach));
      });
   };
   
   exports.fetch = async (guildId, channelId) => {
      await updateAttachments(guildId, channelId);
   };    

   client.on("error", console.error);
   client.on("warn", console.warn);

   client.login(config.token)
} catch {
   console.log("the bot is still starting up");
}