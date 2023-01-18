const { Schema, model } = require("mongoose");

const prefixschema = new Schema({
   prefix: {
      type: String
   },
   guildId: String
});

module.exports = model("prefixes", prefixschema);