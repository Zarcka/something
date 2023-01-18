const { EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ComponentType } = require("discord.js")
const fs = require("fs");
const prefixschema = require("../../../models/prefix");
const { default_prefix } = require("../../../config.js");
let prefix;

module.exports = {
  name: "help",
  description: "Get list of all command and even get to know every command details",
  usage: "help [cmd]",
  category: "Utility",
  run: async (client, message, args) => {
    const data = await prefixschema.findOne({
      guildId: message.guild.id
    });
    prefix = data ? data.prefix : default_prefix;
    const dirs = [];
    const categories = [];
    fs.readdirSync("./commands").forEach((dir) => {
      let commands = fs.readdirSync(`./commands/${dir}`).filter((file) => file.endsWith(".js"));
      const cmds = commands.map((command) => {
        let file = require(`../../commands/${dir}/${command}`);
        return {
          name: dir,
          commands: {
            name: file.name,
            description: file.description,
            aliases: file.aliases
          }
        }
      });
      categories.push(cmds.filter(cat => cat.name === dir));
    });
    categories.forEach(c => {
      dirs.push(cat[0].name);
    });
    const embed = new EmbedBuilder()
      .setColor("#ff6961")
      .setTitle("Help Menu")
      .setDescription(`My prefix in this server is \`${prefix}\`\nSelect a category to view the commands`);
    dirs.forEach((dir, index) => {
      embed.addFields(`${dir.charAt(0).toUpperCase() + dir.slice(1).toLowerCase()}`)
    })
  }
};