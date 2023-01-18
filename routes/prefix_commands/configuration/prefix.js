const prefix = require("../../../models/prefix");

module.exports = {
   name: "prefix",
   category: "configuration",
   usage: "prefix [new-prefix]",
   description: "Change the guild prefix",
   authorPermission: ["ADMINISTRATOR"],
   run: async (client, message, args) => {
      const data = await prefix.findOne({
         GuildId: message.guild.id
      });
      if (!args[0]) return message.channel.send("Please give the prefix that you want to set");
      if (args[1]) return message.channel.send("You can not set prefix a double argument");
      if (args[0].length > 5) return message.channel.send("You can not send prefix more than 5 characters");

      if (data) {
         await prefix.findOneAndRemove({
            guildId: message.guild.id
         });
         message.reply(`The new prefix of this guild is **\`${args[0]}\`**`)
         let newData = new prefix({
            prefix: args[0],
            guildId: message.guild.id
         });
         newData.save()
      } else if (!data) {
         message.reply(`The new prefix of this guild is **\`${args[0]}\`**`)
         let newData = new prefix({
            prefix: args[0],
            guildId: message.guild.id
         });
         newData.save()
      }
   }
}