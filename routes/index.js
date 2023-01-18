const { GatewayIntentBits, Partials, Client, Collection } = require("discord.js"); 
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require("../config");
const fs = require("fs");
const upload = require("../models/upload");
const { timeConverter } = require("./functions/timeconverter")
const { betterMessageFetcher } = require("./functions/bettermessagefetcher")
const client = new Client({
   disableEveryone: true,
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent
   ],
   partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User,
      Partials.GuildMember,
      Partials.Reaction
   ],
});

client.prefix_commands = new Collection();
client.slash_commands = new Collection();
client.aliases = new Collection();

for(let handler of ["slash_command", "prefix_command", "events"]) require(`./handlers/${handler}`)(client);

try {
   const removeDuplicates = async () => {
      const docs = await upload.find({});
      const dedupedDocs = [];
      docs.forEach(doc => {
         let duplicateFound = false;
         dedupedDocs.forEach(d => {
            if (d.desc === doc.desc) {
               duplicateFound = true;
               if (doc.id > d.id) {
                  const index = dedupedDocs.indexOf(d);
                  dedupedDocs[index] = doc;
               }
            }
         });
         if (!duplicateFound) {
            dedupedDocs.push(doc);
         }
      });
      const duplicatesDocs = docs.filter((doc) => !dedupedDocs.includes(doc));
      if (duplicatesDocs.length <= 0) return;
      for (let i = 0; i < duplicatesDocs.length; i++) {
         await upload.deleteOne({
            _id: duplicatesDocs[i]._id
         });
      }
   };

   const processAttachments = async (messages) => {
      const docs = await upload.find({});
      const lastMessageId = await db.get("lastMessageId");
      const latestMessageId = messages.reverse()[messages.length - 1].id;
      if (lastMessageId !== latestMessageId || docs.length === 0) {
         await db.set("lastMessageId", latestMessageId);
         let id = 0;
         const attachments = {};
         messages.forEach(async (message) => {
            if (message.mentions.repliedUser) {
               const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
               const date = timeConverter(repliedTo.createdTimestamp);
               let repliedToAttachment;
               for (const attachment in attachments) {
                  if (attachments[attachment].date === date) {
                     repliedToAttachment = attachments[attachment];
                     break;
                  }
               }
               if (repliedToAttachment) {
                  repliedToAttachment.desc += `\n\n${message.content}`;
                  if (message.reactions.cache.size) {
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
                  }
                  if (message.attachments.size) {
                     repliedToAttachment.attach = repliedToAttachment.attach.concat(Array.from(message.attachments.values()).map(({ url }) => url));
                  }
                  return;
               }
            }
            const date = timeConverter(message.createdTimestamp);
            if (!attachments[date]) {
               attachments[date] = {
                  id: ++id,
                  desc: message.content,
                  date,
                  username: message.author.username,
                  discriminator: message.author.discriminator,
                  attach: Array.from(message.attachments.values()).map(({ url }) => url),
                  reactions: Array.from(message.reactions.cache.values()).map(({ _emoji }) => ({
                     name: _emoji.name,
                     id: _emoji.id || null,
                     count: _emoji.reaction.count
                  }))
               };
            } else {
               attachments[date].desc += `\n\n${message.content}`;
               if (message.attachments.size) {
                  attachments[date].attach = attachments[date].attach.concat(Array.from(message.attachments.values()).map(({ url }) => url));
               }
               if (message.reactions.cache.size) {
                  attachments[date].reactions = attachments[date].reactions.concat(Array.from(message.reactions.cache.values()).map(({ _emoji }) => ({
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
               }
            }
         });
         return Object.values(attachments);
      } else {
         return false;
      }
   };

   const updateAttachments = async (guildId, channelId) => {
      const docs = await upload.find({});
      const guild = client.guilds.cache.get(guildId);
      const channel = await guild.channels.fetch(channelId);
      const messages = await betterMessageFetcher(channel);
      const attachments = await processAttachments(messages);
      if (!attachments) return;
      await removeDuplicates();
      const hasNewProperty = attachments.some(a => {
         for (const prop in a) {
            if (!docs.some(o => prop in o)) {
               return true;
            }
         }
         return false;
      });
      if (hasNewProperty) {
         await upload.deleteMany({});
      }
      const newAttachments = Array.from(new Set(attachments.filter(a => !docs.some(o => o.desc === a.desc))));
      if (newAttachments.length === 0) return;
      const createAttachments = newAttachments.map(attachment => upload.create({
         id: attachment.id,
         desc: attachment.desc,
         date: attachment.date,
         username: attachment.username,
         discriminator: attachment.discriminator,
         attach: attachment.attach,
         reactions: attachment.reactions
      }));
      await Promise.all(createAttachments);
      await removeDuplicates();
   };

   exports.fetch = async (guildId, channelId) => {
      await updateAttachments(guildId, channelId);
   };

   client.on("error", console.error);
   client.on("warn", console.warn);

   process.on("unhandledRejection", async (err, promise) => {
      console.error(`Unhandled Rejection: ${err}`.red);
      console.error(promise);
    });

   client.login(config.token)
} catch {
   console.log("the bot is still starting up");
}