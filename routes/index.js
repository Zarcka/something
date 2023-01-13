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

   async function betterMessageFetcher(channel, limit = 10000) {
      const sum_messages = [];
      let last_id;
      while (true) {
         const options = { limit: 100 };
         if (last_id) { options.before = last_id; }
         const messages = await channel.messages.fetch(options);
         sum_messages.push(...messages.values());
         last_id = messages.last().id;
         if (messages.size != 100 || sum_messages >= limit) { break; }
      }
      return sum_messages;
   }

   const removeDuplicates = async () => {
      const attachments = JSON.parse(fs.readFileSync("./models/attachments.json"));
      const docs = await upload.find({});
      const dedupedAttachments = attachments.filter((attachment, index, self) => self.findIndex(a => a.desc === attachment.desc) === index);
      const duplicatesAttachments = attachments.filter((attachment) => !dedupedAttachments.includes(attachment));
      const dedupedDocs = docs.filter((doc, index, self) => self.findIndex(d => d.desc === doc.desc) === index);
      const duplicatesDocs = docs.filter((doc) => !dedupedDocs.includes(doc));
      if (duplicatesAttachments.length <= 0 && duplicatesDocs.length <= 0) return;
      for (let i = 0; i < duplicatesAttachments.length; i++) {
         attachments.splice(attachments.indexOf(duplicatesAttachments[i]), 1);
      }
      for (let i = 0; i < duplicatesDocs.length; i++) {
         await upload.deleteOne({
            _id: duplicatesDocs[i]._id
         });
      }
      fs.writeFileSync("./models/attachments.json", JSON.stringify(attachments));
   };

   const processAttachments = async (messages) => {
      let id = 0;
      const attachments = [];
      const promises = messages.map(async (message) => {
         if (message.type === "REPLY") {
            const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
            const repliedToAttachment = attachments.find(a => timeConverter(repliedTo.createdTimestamp) === a.date);
            repliedToAttachment.desc += `\n\n${message.content}`;
            repliedToAttachment.reactions = repliedToAttachment.reactions.concat(Array.from(message.reactions.cache.values()).map(({ _emoji }) => ({
               name: _emoji.name,
               id: _emoji.id || null,
               count: _emoji.reaction.count
            }))).reduce((acc, reaction) => {
               const existingReaction = acc.find((r) => r.name === reaction.name || r.id === reaction.id);
               if (existingReaction) {
                  existingReaction.count += reaction.count;
               } else {
                  acc.push(reaction);
               }
               return acc;
            }, []);
            if (message.attachments.size) {
               repliedToAttachment.attach = repliedToAttachment.attach.concat(Array.from(message.attachments.values()).map(({ url }) => url));
            }
            const index = attachments.indexOf(repliedToAttachment);
            attachments[index] = repliedToAttachment;
            return;
         }
         const attach = Array.from(message.attachments.values()).map(({ url }) => url);
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
      await Promise.all(promises);
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
      const docs = await upload.find({});
      const guild = client.guilds.cache.get(guildId);
      const channel = await guild.channels.fetch(channelId);
      const messages = await betterMessageFetcher(channel);
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
      await removeDuplicates();
      if (newAttachments.length === 0) return;
      const newAttach = Array.from(new Set(old.concat(newAttachments)));
      const filtered = Array.from(new Set(newAttach.filter(a => !docs.some(o => o.id === a.id))));
      if (filtered.length === 0) return;
      const createAttachments = filtered.map(attachment => upload.create({
         id: attachment.id,
         desc: attachment.desc,
         date: attachment.date,
         username: attachment.username,
         discriminator: attachment.discriminator,
         attach: attachment.attach,
         reactions: attachment.reactions
      }));
      await Promise.all(createAttachments);
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