module.exports = {
   run: async (client, interaction) => {
      if (interaction.isChatInputCommand()) {
         const command = client.slash_commands.get(interaction.commandName);

         if (!command) return;

         try {
            command.run(client, interaction);
         } catch (e) {
            console.error(e)
         };
      };

      if (interaction.isUserContextMenuCommand()) { // User:
         const command = client.user_commands.get(interaction.commandName);

         if (!command) return;

         try {
            command.run(client, interaction);
         } catch (e) {
            console.error(e)
         };
      };

      if (interaction.isMessageContextMenuCommand()) { // Message:
         const command = client.message_commands.get(interaction.commandName);

         if (!command) return;

         try {
            command.run(client, interaction);
         } catch (e) {
            console.error(e)
         };
      };
   }
};