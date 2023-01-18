"use strict";
const { ActivityType } = require("discord.js");
class setPresence {
   constructor(client, statusOptions) {
      setInterval(() => {
         let _a;
         const options = Math.floor(Math.random() * statusOptions.length);
         const presence = statusOptions[options].type !== ActivityType.Streaming ? {
           activities: [{
              name: statusOptions[options].content,
              type: statusOptions[options].type,
           }, ],
           status: statusOptions[options].status,
        } : {
           activities: [{
              name: statusOptions[options].content,
              type: statusOptions[options].type,
              url: statusOptions[options].url,
           }, ],
           status: statusOptions[options].status,
        };
         (_a = client.user) === null || _a === void 0 ? void 0 : _a.setPresence(presence);
      }, 8 * 1000);
   }
}

exports.default = setPresence;