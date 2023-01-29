import { Client, CommandInteraction, Message, SlashCommandBuilder, } from "discord.js";

declare type Command = {
   data: {
      name: string;
      description?: string;
      usage?: string;
      ownerOnly?: boolean;
      alias?: string[];
      botPermission?: string[];
      authorPermission?: string[];
   };
   run: (client: Client, message: Message, args: string[]) => Promise<void>;
};

declare type SlashCommand = {
   data: SlashCommandBuilder;
   run: (client: Client, interaction: CommandInteraction) => Promise<void>;
};

export { Command, SlashCommand };
