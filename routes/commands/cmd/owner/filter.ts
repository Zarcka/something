import { CommandBuilder } from "../../../components/CommandBuilder";
import upload from "../../../../models/upload";

export default new CommandBuilder({
   data: {
      name: "filter",
      ownerOnly: true,
   },
   async run(client, message, args) {
      try {
         const searchTerm = message.content.substring(message.content.indexOf(" ") + 1);
         if (!searchTerm) return message.reply("Please provide a search term.");

         const attachments = await upload.find({ desc: { $regex: `(?<=\\b)${searchTerm}(?=\\b)`, $options: "i" } });
         if (!attachments.length) return message.reply("No attachments found with that search term.");

         let filteredAttachments = "";
         attachments.forEach((attachment) => {
            filteredAttachments += `Attachment ID: ${attachment.id}\nAttachment Count: ${attachment.attach.length}\nDescription: \n${attachment.desc}\n\n`;
         });

         message.reply(`Found ${attachments.length} attachments with the search term "${searchTerm}":\n${filteredAttachments}`);
      } catch (err) {
         message.reply({ content: "An error occurred while dropping the database. Please try again later." });
         console.error(err);
      }
   }
});