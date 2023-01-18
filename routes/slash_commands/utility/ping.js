const { EmbedBuilder } = require("discord.js")

module.exports = {
   name: "ping",
   description: "Replies with pong!",
   type: 1,
   options: [],
   permissions: {
      DEFAULT_MEMBER_PERMISSIONS: "SendMessages"
   },
	run: async (client, interaction) => {
      const ping = new EmbedBuilder()
         .setColor("Random")
         .setTitle("Pong!")
         .setDescription(`My ping is \`${client.ws.ping}ms\``);
      await interaction.reply({ embeds: [ping] });
   }
}