import { Schema, model } from 'mongoose';

const prefixschema = new Schema({
   prefix: {
      type: String
   },
   guildId: String
});

export default model<any>("prefixes", prefixschema);