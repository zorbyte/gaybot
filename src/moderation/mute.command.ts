import { Duration } from "@sapphire/time-utilities";
import {
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { GaybotCommand } from "../command.js";
import { Ticket } from "../tickets/ticket.js";

import { createInfraction } from "./infractions/infraction.js";
import { ModerationErrors } from "./errors.js";
import { Punishment } from "./punishment.js";

export const MuteCommand: GaybotCommand = {
  builder: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutes a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    // .setDMPermission(false)
    .addUserOption(u =>
      u
        .setName("target")
        .setDescription("The user to be muted.")
        .setRequired(true)
    )
    .addStringOption(s =>
      s
        .setName("reason")
        .setDescription("The reason why the user was muted.")
        .setRequired(true)
    )
    .addStringOption(s =>
      s
        .setName("duration")
        .setDescription("The duration to mute for — ie. 7y 6w 5d 4h 3m 2s 1ms")
    )
    .addAttachmentOption(a =>
      a
        .setName("evidence")
        .setDescription("Any evidence such as screenshots for the infraction.")
        .setRequired(false)
    ),

  async executor(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const targetId = interaction.options.getUser("user", true).id;

    const me = await interaction.guild!.members.fetchMe();
    const canManageRoles = me.permissions.has(PermissionFlagsBits.ManageRoles);
    if (!canManageRoles) {
      throw new ModerationErrors.NoPermissionsForMute(
        interaction.guildId!,
        targetId
      );
    }

    const ticket = new Ticket();

    const rawDuration = interaction.options.getString("duration", false);
    const duration = rawDuration !== null ? new Duration(rawDuration) : void 0;

    const infr = await createInfraction({
      moderatorId: interaction.user.id,
      targetId: interaction.options.getUser("user", true).id,
      guildId: interaction.guildId!,
      punishment: Punishment.Mute,
      reason: interaction.options.getString("reason", true),
      ticket,
      duration: duration?.offset,
      createdAt: interaction.createdAt,
    });
  },
};

async function mute(target: GuildMember) {
  /* TODO */
}
