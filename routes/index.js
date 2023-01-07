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
      console.log(`${client.user.username} is ready`);
      client.user.setPresence({
         activities: [
            {
               name: "#owners-gallery",
               type: "WATCHING"
            },
         ],
         status: "idle",
      }); 
   });

   const removeDuplicates = async () => {
      const docs = await upload.find({});
      const dedupedDocs = docs.filter((doc, index, self) => self.findIndex(d => d.id === doc.id) === index);
      const duplicates = docs.filter((doc) => !dedupedDocs.includes(doc));
      duplicates.forEach(async (duplicate) => {
         await upload.deleteOne({ _id: duplicate._id });
      });
   };

   const processAttachments = async (messages) => {
      let id = 0;
      const attachments = [];
      messages.forEach((message) => {
         const attach = Array.from(message.attachments.values()).map(({url}) => url);
         const desc = message.content;
         const date = timeConverter(message.createdTimestamp);
         const username = message.author.username;
         const discriminator = message.author.discriminator;
         const reactions = Array.from(message.reactions.cache.values()).map(({ _emoji }) => ({
            name: _emoji.name,
            id: _emoji.id || null,
            count: _emoji.reaction.count
         }));
         attachments.push({
            id: ++id,
            desc,
            date,
            username,
            discriminator,
            attach,
            reactions
         });
      });
      attachments.reverse();
      for (let i = 1; i < attachments.length; i++) {
         if (attachments[i].date === attachments[i - 1].date) {
            attachments[i - 1].desc += `\n\n${attachments[i].desc}`;
            attachments[i - 1].attach = attachments[i - 1].attach.concat(attachments[i].attach);
            attachments[i - 1].reactions = attachments[i - 1].reactions.concat(attachments[i].reactions).reduce((acc, reaction) => {
               const existingReaction = acc.find((r) => r.name === reaction.name || r.id === reaction.id);
               if (existingReaction) {
                  existingReaction.count += reaction.count;
               } else {
                  acc.push(reaction);
               }
               return acc;
            }, []);
            attachments.splice(i, 1);
            i--;
         }
      }
      return attachments;
   };
   
   const updateAttachments = async (guildId, channelId) => {
      await removeDuplicates();
      upload.find({}, async function (err, docs) {
         const guild = client.guilds.cache.get(guildId);
         const channel = await guild.channels.fetch(channelId);
         const messages = await channel.messages.fetch();
         const attachments = await processAttachments(messages);
         const old = JSON.parse(fs.readFileSync("./models/attachments.json"));
         const hasNewProperty = attachments.some(a => {
            for (const prop in a) {
               if (!old.some(o => prop in o)) {
                  return true;
               }
            }
            return false;
         });
         if (hasNewProperty) {
            await upload.deleteMany({});
         }
         const newAttachments = Array.from(new Set(attachments.filter(a => !old.some(o => o.id === a.id))));
         const newAttach = Array.from(new Set(old.concat(newAttachments)));
         const filtered = Array.from(new Set(newAttach.filter(a => !docs.some(o => o.id === a.id))));
         if (filtered.length > 0) {
            filtered.forEach(async (a) => {
               await upload.create({
                  id: a.id,
                  desc: a.desc,
                  date: a.date,
                  username: a.username,
                  discriminator: a.discriminator,
                  attach: a.attach,
                  reactions: a.reactions,
               });
            });
         } else {
            return;
         }
         fs.writeFileSync("./models/attachments.json", JSON.stringify(newAttach));
         await removeDuplicates();
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