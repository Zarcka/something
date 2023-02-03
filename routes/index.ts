import { GatewayIntentBits, Partials, Client, Collection } from "discord.js";
import { QuickDB } from "quick.db";
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
   if (duplicatesDocs.length <= 0) {
      console.log('No duplicates found');
      return;
   }
   for (let i = 0; i < duplicatesDocs.length; i++) {
      console.log(`Deleting duplicate ${i + 1} of ${duplicatesDocs.length}`);
      try {
         await upload.deleteOne({
            _id: duplicatesDocs[i]._id
         });
      } catch (err) {
         console.log(`Could not delete duplicate ${i + 1} of ${duplicatesDocs.length}`);
      }
   }
   console.log('Finished removing duplicates');
};

const processAttachments = async (messages: any[]): Promise<any | false> => {
   const docs = await upload.find({});
   const lastMessageId = await db.get("lastMessageId");
   const latestMessageId = messages.reverse()[messages.length - 1].id;
   if (lastMessageId !== latestMessageId || docs.length === 0) {
      await db.set("lastMessageId", latestMessageId);
      const attachments: { [key: string]: { id: number, desc: string, date: string, username: string, discriminator: string, attach: string[], reactions: { name: string, id: string | null, count: number }[] } } = {};
      messages.forEach(async (message) => {
         const date = timeConverter(message.createdTimestamp);
         const reactions = Array.from(message.reactions.cache.values()).map(({ _emoji }: any) => ({
            name: _emoji.name,
            id: _emoji.id || null,
            count: _emoji.reaction.count
         }));
         const attach = Array.from(message.attachments.values()).map(({ url }: any) => url);
         if (message.mentions.repliedUser) {
            const repliedTo = await message.channel.messages.fetch(message.reference.messageId).catch((): any => null);
            if (repliedTo) {
               const replyDate = timeConverter(repliedTo.createdTimestamp);
               const replyAttachment = attachments[replyDate];
               if (replyAttachment) {
                  replyAttachment.desc += `\n\n${message.content}`;
                  replyAttachment.reactions = [...replyAttachment.reactions, ...reactions];
                  replyAttachment.attach = [...replyAttachment.attach, ...attach];
                  return;
               }
            }
         }
         if (attachments[date]) {
            attachments[date].desc += `\n\n${message.content}`;
            attachments[date].reactions = [...attachments[date].reactions, ...reactions];
            attachments[date].attach = [...attachments[date].attach, ...attach];
         } else {
            attachments[date] = {
               id: Object.values(attachments).length + 1,
               desc: message.content,
               date,
               username: message.author.username,
               discriminator: message.author.discriminator,
               attach,
               reactions,
            };
         }
      });
      return Object.values(attachments);
   }
   return false;
};

const updateAttachments = async (guildId: string, channelId: string) => {
   const docs = await upload.find({});
   const guild = client.guilds.cache.get(guildId);
   const channel = await guild.channels.fetch(channelId);
   const messages = await betterMessageFetcher(channel);
   const attachments = await processAttachments(messages);
   if (!attachments) return;
   const hasNewProperty = attachments.some((a: any) => {
      for (const prop in a) {
         if (!docs.some((o: any) => prop in o)) {
         return true;
         }
      }
      return false;
   });
   if (hasNewProperty) {
      upload.deleteMany({});
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
   removeDuplicates();
};

export const get = async (guildId: string, channelId: string): Promise<void> => {
   try {
      updateAttachments(guildId, channelId);
   } catch (e) {
      console.error(e);
   }
};

client.on("error", console.error);
client.on("warn", console.warn);

process.on("unhandledRejection", async (err, promise) => {
   console.error(`Unhandled Rejection: ${err}`);
   console.error(promise);
});

client.login(config.token);