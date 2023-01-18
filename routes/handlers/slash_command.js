const { readdirSync } = require("fs"),
ascii = require("ascii-table");

let table = new ascii("Commands");
table.setHeading("Slash Commands", "Load status");

module.exports = (client) => {
   readdirSync("./routes/slash_commands").forEach(dir => {
      const commands = readdirSync(`./routes/slash_commands/${dir}/`).filter(file => file.endsWith(".js"));

      for (let file of commands) {
         let pull = require(`../slash_commands/${dir}/${file}`);

         client.slash_commands.set(pull.name, pull);
         table.addRow(file, '✅');

         if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
      }
   });
   console.log(table.toString());
}