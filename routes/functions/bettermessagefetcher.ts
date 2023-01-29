export const betterMessageFetcher = async (channel: any, limit: number = 10000): Promise<any[]> => {
   const sum_messages: any[] = [];
   let last_id: any;
   while (true) {
      const options: any = { limit: 100 };
      if (last_id) { options.before = last_id; }
      const messages = await channel.messages.fetch(options);
      sum_messages.push(...messages.values());
      last_id = messages.last().id;
      // @ts-ignore
      if (messages.size !== 100 || sum_messages >= limit) { break; }
   }
   return sum_messages;
};