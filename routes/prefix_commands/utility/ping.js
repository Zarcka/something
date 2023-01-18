const { EmbedBuilder } = require("discord.js")

module.exports = {
   name: "ping",
   category: "Utility",
   description: "Get my current ping",
   usage: "ping",
   run: async (client, message) => {
      const ping = new EmbedBuilder()
         .setColor("Random")
         .setTitle("Pong!")
         .setDescription(`My ping is \`${client.ws.ping}ms\``);
      await message.reply({ embeds: [ping] });
   }
}