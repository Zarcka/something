import { GatewayIntentBits, Partials, Client, Collection } from "discord.js";
import { QuickDB } from 'quick.db';
import config from "../config";
import handler from "./handler/main";
import upload from "../models/upload";
import { timeConverter } from "./functions/timeconverter"
import { betterMessageFetcher } from "./functions/bettermessagefetcher"

const db = new QuickDB();

const client = new Client({
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

const commands = new Collection();
const slashs = new Collection();

handler(client);

export { commands, slashs };

const removeDuplicates = async (): Promise<void> => {
   const docs = await upload.find({});
   const dedupedDocs: any[] = [];
   docs.forEach((doc: { desc: any; id: number; }) => {
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

const processAttachments = async (messages: any[]) => {
   const docs = await upload.find({});
   const lastMessageId = await db.get("lastMessageId");
   const latestMessageId = messages.reverse()[messages.length - 1].id;
   if (lastMessageId !== latestMessageId || docs.length === 0) {
      await db.set("lastMessageId", latestMessageId);
      let id = 0;
      const attachments: any = {};
      messages.forEach(async (message: any) => {
         if (message.mentions.repliedUser) {
            const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
            const date = timeConverter(repliedTo.createdTimestamp);
            let repliedToAttachment: any;
            for (const attachment in attachments) {
               if (attachments[attachment].date === date) {
                  repliedToAttachment = attachments[attachment];
                  break;
               }
            }
            if (repliedToAttachment) {
               repliedToAttachment.desc += `\n\n${message.content}`;
               if (message.reactions.cache.size) {
                  repliedToAttachment.reactions = repliedToAttachment.reactions.concat(Array.from(message.reactions.cache.values()).map(({ _emoji }: any) => ({
                     name: _emoji.name,
                     id: _emoji.id || null,
                     count: _emoji.reaction.count
                  }))).reduce((acc: any, reaction: any) => {
                     const existingReaction = acc.find((r: any) => r.name === reaction.name || r.id === reaction.id);
                     if (existingReaction) {
                        existingReaction.count += reaction.count;
                     } else {
                        acc.push(reaction);
                     }
                     return acc;
                  }, []);
               }
               if (message.attachments.size) {
                  repliedToAttachment.attach = repliedToAttachment.attach.concat(Array.from(message.attachments.values()).map(({ url }: any) => url));
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
               attach: Array.from(message.attachments.values()).map(({ url }: any) => url),
               reactions: Array.from(message.reactions.cache.values()).map(({ _emoji }: any) => ({
                  name: _emoji.name,
                  id: _emoji.id || null,
                  count: _emoji.reaction.count
               }))
            };
         } else {
            attachments[date].desc += `\n\n${message.content}`;
            if (message.attachments.size) {
               attachments[date].attach = attachments[date].attach.concat(Array.from(message.attachments.values()).map(({ url }: any) => url));
            }
            if (message.reactions.cache.size) {
               attachments[date].reactions = attachments[date].reactions.concat(Array.from(message.reactions.cache.values()).map(({ _emoji }: any) => ({
                     name: _emoji.name,
                     id: _emoji.id || null,
                     count: _emoji.reaction.count
               }))).reduce((acc: any, reaction: any) => {
                  const existingReaction = acc.find((r: any) => r.name === reaction.name || r.id === reaction.id);
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

const updateAttachments = async (guildId: string, channelId: string) => {
   const docs = await upload.find({});
   const guild = client.guilds.cache.get(guildId);
   const channel = await guild.channels.fetch(channelId);
   const messages = await betterMessageFetcher(channel);
   const attachments = await processAttachments(messages);
   if (!attachments) return;
   await removeDuplicates();
   const hasNewProperty = attachments.some((a: any) => {
      for (const prop in a) {
         if (!docs.some((o: any) => prop in o)) {
         return true;
         }
      }
      return false;
   });
   if (hasNewProperty) {
      await upload.deleteMany({});
   }
   const newAttachments = Array.from(new Set(attachments.filter((a: any) => !docs.some((o: any) => o.desc === a.desc))));
   if (newAttachments.length === 0) return;
   const createAttachments = newAttachments.map((attachment: any) => upload.create({
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

export const get = async (guildId: string, channelId: string): Promise<void> => {
   await updateAttachments(guildId, channelId);
};

client.on("error", console.error);
client.on("warn", console.warn);

process.on("unhandledRejection", async (err, promise) => {
   console.error(`Unhandled Rejection: ${err}`);
   console.error(promise);
});

client.login(config.token);