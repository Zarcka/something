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
         activities: [{
            name: "#owners-gallery",
            type: "WATCHING"
         }],
         status: "idle",
      });
   });

   const removeDuplicates = async () => {
      const docs = await upload.find({});
      const dedupedDocs = docs.filter((doc, index, self) => self.findIndex(d => d.id === doc.id) === index);
      const duplicates = docs.filter((doc) => !dedupedDocs.includes(doc));
      for (let i = 0; i < duplicates.length; i++) {
         await upload.deleteOne({
            _id: duplicates[i]._id
         });
      }
   };

   const processAttachments = async (messages) => {
      let id = 0;
      const attachments = [];
      for (let i = 0; i < messages.length; i++) {
         const attach = Array.from(messages[i].attachments.values()).map(({url}) => url);
         const desc = messages[i].content;
         const date = timeConverter(messages[i].createdTimestamp);
         const username = messages[i].author.username;
         const discriminator = messages[i].author.discriminator;
         const reactions = Array.from(messages[i].reactions.cache.values()).map(({_emoji}) => ({
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
      }
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
      return attachments.reverse();
   };

   const updateAttachments = async (guildId, channelId) => {
      await removeDuplicates();
      const docs = await upload.find({});
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
      if(newAttachments.length === 0) return;
      const newAttach = Array.from(new Set(old.concat(newAttachments)));
      const filtered = Array.from(new Set(newAttach.filter(a => !docs.some(o => o.id === a.id))));
      if (filtered.length === 0) return;
      for (let i = 0; i < filtered.length; i++) {
         await upload.create({
            id: filtered[i].id,
            desc: filtered[i].desc,
            date: filtered[i].date,
            username: filtered[i].username,
            discriminator: filtered[i].discriminator,
            attach: filtered[i].attach,
            reactions: filtered[i].reactions,
         });
      }
      fs.writeFileSync("./models/attachments.json", JSON.stringify(newAttach));
      await removeDuplicates();
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