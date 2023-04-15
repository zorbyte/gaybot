import {
  ContextMenuCommandBuilder,
  Interaction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

// TODO: After prototyping, this deserves an upgrade, with type construction etc.

export interface GaybotCommand {
  parent?: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder;
  builder:
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandBuilder
    | ContextMenuCommandBuilder
    | SlashCommandSubcommandGroupBuilder
    | SlashCommandSubcommandBuilder;

  executor: (interaction: Interaction) => unknown;
}
