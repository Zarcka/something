const upload = require("../../../models/upload");

module.exports = {
   name: "drop",
   ownerOnly: "true",
   run: async (client, message) => {
      try {
         await upload.deleteMany({});
         message.reply({ content: "Database dropped successfully." });
      } catch (err) {
         message.reply({ content: "An error occurred while dropping the database. Please try again later." });
         console.error(err);
      }
   }
}