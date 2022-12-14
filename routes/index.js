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

client.on("ready", async () => {
  console.log("bot is ready");
});

exports.fetch = async function() {
  const guild = client.guilds.cache.get("688660450568699986");
  const channel = await guild.channels.fetch("933943929643098142");
  channel.messages.fetch().then(async (messages) => {
    const attachments = [];
    messages.forEach((message) => {
        const attach = Array.from(message.attachments.values()).map(({url}) => url);
        const desc = message.content;
        const date = timeConverter(message.createdTimestamp);
        attachments.push({
          desc,
          date,
          attach,
        });
    });
    attachments.reverse();
    for (let i = 1; i < attachments.length; i++) {
      if (attachments[i].date === attachments[i - 1].date) {
        attachments[i - 1].desc += `\n${attachments[i].desc}`;
        attachments[i - 1].attach = attachments[i - 1].attach.concat(attachments[i].attach);
        attachments.splice(i, 1);
        i--;
      }
    }
    upload.find({}, async function (err, docs) {
      if (err) {
        console.log(err);
        return;
      }
      const old = JSON.parse(fs.readFileSync("./models/attachments.json"));
      const newAttachments = attachments.filter(
        (a) => !old.some((o) => o.img === a.img)
      );
      const newAttach = old.concat(newAttachments);
      const filtered = newAttach.filter(
        (a) => !docs.some((o) => o.img === a.img)
      );
      if (filtered.length > 0) {
        filtered.forEach(async (a) => {
          await upload.create({
            desc: a.desc,
            date: a.date,
            attach: a.attach,
          });
        });
      } else {
        return;
      }
      fs.writeFileSync("./models/attachments.json", JSON.stringify(newAttach));
    });
  });
};

client.on("error", console.error);
client.on("warn", console.warn);

client.login(config.token);