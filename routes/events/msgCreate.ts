import { commands } from "..";
import ClientEvent from "../components/ClientEvent";
import config from "../../config";
import prefixModel from "../../models/prefix";
import { Command } from "../types/Collections";
const cooldown: { [key: string]: { [key: string]: number } } = {};
let prefix;

export default new ClientEvent("messageCreate", async (client, message) => {
   try {
      if (message.author.bot || !message.guild) return;

      const data = await prefixModel.findOne({
         guildId: message.guild.id
      });

      prefix = data ? data.prefix : config.default_prefix;

      if (!message.content.startsWith(prefix)) return;
      if (!message.member) (message.member as any) = await message.guild.members.fetch(message);

      const args = message.content.slice(prefix.length).trim().split(/ +/g);
      const command = args.shift()?.toLowerCase();

      // @ts-ignore
      const cmd: Command | undefined = commands.find(
         (c: Command) => c.data.name === command || (c.data.alias && c.data.alias.includes(`${command}`))
      );

      if (!cmd) {
         await message.channel.sendTyping();
         return await message.reply({
            content: `Command \`${command}\` does not exist`,
         });
      }

      if (cmd.data.botPermission) {
         const permissions = cmd.data.botPermission.filter((x: any) => !message.guild.members.me.permissions.has(x)).map(x => "`" + x + "`");
         if (permissions.length) return message.reply({ content: `I need ${permissions.join(", ")} permission(s) to execute the command!` });
      }

      if (cmd.data.authorPermission) {
         const permissions = cmd.data.authorPermission.filter((x: any) => !message.guild.members.me.permissions.has(x)).map(x => "`" + x + "`");
         if (permissions.length) return message.reply({ content: `You need ${permissions.join(", ")} permission(s) to execute this command!` });
      }

      if (cmd.data.ownerOnly && !config.ownerID.includes(message.author.id)) return message.reply({ content: "I am sorry but this command can only be used by owner and creators!" });

      let uCooldown = cooldown[message.author.id];
      if (!uCooldown) {
         cooldown[message.author.id] = {}
         uCooldown = cooldown[message.author.id]
      }

      const time = uCooldown[cmd.data.name] || 0;
      if (time && (time > Date.now())) return message.reply({ content: `You can again use this command in ${Math.ceil((time - Date.now()) / 1000)} second(s)` });
      cooldown[message.author.id][cmd.data.name] = Date.now() + cmd.data.cooldown;

      await message.channel.sendTyping();
      await cmd.run(client, message, args);
   } catch (err) {
      console.log(err);
      // @ts-ignore
      await message.reply({ content: err.message });
   }
});
