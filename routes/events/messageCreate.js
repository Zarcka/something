const prefixschema = require("../../models/prefix");
const { ownerID, default_prefix } = require("../../config.js");
const cooldown = {};
let prefix;

module.exports.run = async (client, message) => {
   if (message.author.bot || !message.guild) return;

   const data = await prefixschema.findOne({
      guildId: message.guild.id
   });

   prefix = data ? data.prefix : default_prefix;

   if (!message.content.startsWith(prefix)) return;
   if (!message.member) message.member = await message.guild.members.fetch(message);

   const args = message.content.slice(prefix.length).trim().split(/ +/g);
   const cmd = args.shift().toLowerCase();

   let command = client.prefix_commands.get(cmd);
   if (!command) command = client.prefix_commands.get(client.aliases.get(cmd));
   if (!command) return;

   /* perms */
   if (command.botPermission) {
      const Permissions = command.botPermission.filter(x => !message.guild.members.me.permissions.has(x)).map(x => "`" + x + "`")
      if (Permissions.length) return message.reply({
         content: `I need ${Permissions.join(", ")} permission(s) to execute the command!`
      })
   }

   if (command.authorPermission) {
      const Permissions = command.authorPermission.filter(x => !message.guild.members.me.permissions.has(x)).map(x => "`" + x + "`")
      if (Permissions.length) return message.reply({
         content: `You need ${Permissions.join(", ")} permission(s) to execute this command!`
      })
   }

   /* owner */
   if (command.ownerOnly && !ownerID.includes(message.author.id)) return message.reply({
      content: "I'm sorry but this command can only be used by the creators!"
   })

   /* cooldown */
   let uCooldown = cooldown[message.author.id];
   if (!uCooldown) {
      cooldown[message.author.id] = {}
      uCooldown = cooldown[message.author.id]
   }

   const time = uCooldown[command.name] || 0
   if (time && (time > Date.now())) return message.reply({
      content: `You can again use this command in ${Math.ceil((time - Date.now()) / 1000)} second(s)`
   })
   cooldown[message.author.id][command.name] = Date.now() + command.cooldown;

   if (command) command.run(client, message, args);
}