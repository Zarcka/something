export const betterMessageFetcher = async (channel: any, limit: number = 10000): Promise<any[]> => {
   const sum_messages: any[] = [];
   let last_id: any;
   while (true) {
      const options: any = { limit: 100 };
      if (last_id) { options.before = last_id; }
      const messages = await channel.messages.fetch(options).catch((e: any) => console.log(e));
      if (!messages) { continue; }
      sum_messages.push(...messages.values());
      last_id = messages.last().id;
      if (messages.size !== 100 || sum_messages.length >= limit) { break; }
   }
   return sum_messages;
};