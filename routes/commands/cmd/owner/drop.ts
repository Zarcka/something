import { CommandBuilder } from "../../../components/CommandBuilder";
import upload from "../../../../models/upload";

export default new CommandBuilder({
   data: {
      name: "drop",
      description: "database go boom",
      ownerOnly: true,
   },
   async run(client, message, args) {
      try {
         await upload.deleteMany({});
         message.reply({ content: "Database dropped successfully." });
      } catch (err) {
         message.reply({ content: "An error occurred while dropping the database. Please try again later." });
         console.error(err);
      }
   }
});