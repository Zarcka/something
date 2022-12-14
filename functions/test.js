// const arr = [{
//       "desc": "<@&933943397440450631>  a few sketches + Sayu's birthday art <:Sucrose_Smol:927825315965841448>",
//       "date": "23 Oct 2022 3:42:3",
//       "attach": "https://cdn.discordapp.com/attachments/933943929643098142/1033480376989003876/Untitled2192_20221011124806.png"
//    },
//    {
//       "desc": "<@&933943397440450631>  a few sketches + Sayu's birthday art <:Sucrose_Smol:927825315965841448>",
//       "date": "23 Oct 2022 3:42:3",
//       "attach": "https://cdn.discordapp.com/attachments/933943929643098142/1033480377337135306/Untitled2200_20221018222701.png"
//    },
//    {
//       "desc": "<@&933943397440450631>  a few sketches + Sayu's birthday art <:Sucrose_Smol:927825315965841448>",
//       "date": "23 Oct 2022 3:42:3",
//       "attach": "https://cdn.discordapp.com/attachments/933943929643098142/1033480377685250129/Untitled2201_20221019234753.png"
//    },
// ];

const arr = require("../models/attachments.json");

for (let i = 1; i < arr.length; i++) {
   if (arr[i].date === arr[i - 1].date) {
     arr[i - 1].desc += `\n${arr[i].desc}`;
     arr[i - 1].attach = arr[i - 1].attach.concat(arr[i].attach);
     arr.splice(i, 1);
     i--;
   }
 }
 
 console.log(arr);