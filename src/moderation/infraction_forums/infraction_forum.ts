import { DurationFormatter } from "@sapphire/time-utilities";
import {
  ChannelType,
  Client,
  EmbedBuilder,
  ForumChannel,
  GuildForumTagData,
  Snowflake,
  User,
} from "discord.js";
import { Container } from "typedi";

import { getModerationConfig } from "../config.js";
import { UnsavedInfraction } from "../infractions/infraction.js";
import {
  getPunishmentUIElements,
  Punishment,
  PUNISHMENT_EMOJIS,
} from "../punishment.js";

import { InfractionForumErrors } from "./errors.js";

const client = Container.get(Client);

export async function getInfractionForum(guildId: Snowflake) {
  const config = await getModerationConfig(guildId);

  if (typeof config?.infractionForumId === "undefined") {
    throw new InfractionForumErrors.NoChannelConfigured(guildId);
  }

  const channel = await client.channels.fetch(config.infractionForumId);
  if (channel === null) {
    throw new InfractionForumErrors.ChannelNotFound(
      guildId,
      config.infractionForumId
    );
  }

  const guildChannel = await channel.fetch();
  if (guildChannel.type !== ChannelType.GuildForum) {
    throw new InfractionForumErrors.NotAForum(guildId, guildChannel.id);
  }

  return guildChannel;
}

const DEFAULT_TAGS: GuildForumTagData[] = [
  createForumTagData(PUNISHMENT_EMOJIS[Punishment.Ban], "Punishment: Ban"),
  createForumTagData(PUNISHMENT_EMOJIS[Punishment.Kick], "Punishment: Kick"),
  createForumTagData(PUNISHMENT_EMOJIS[Punishment.Mute], "Punishment: Mute"),
  createForumTagData(
    PUNISHMENT_EMOJIS[Punishment.Timeout],
    "Punishment: Timeout"
  ),
  createForumTagData("✅", "Status: Resolved"),
  createForumTagData("⚠", "Status: Disputed"),
  createForumTagData("🤝", "Status: Pardoned"),
];

export async function setupInfractionForumTags(forum: ForumChannel) {
  if (
    // checks if the available tags are the same as the default tags
    forum.availableTags.length === DEFAULT_TAGS.length &&
    forum.availableTags.filter(
      t =>
        !!DEFAULT_TAGS.find(
          dt =>
            t.name == dt.name &&
            t.emoji == dt.emoji &&
            t.moderated == dt.moderated
        ) ?? false
    ).length !== DEFAULT_TAGS.length
  ) {
    // if they aren't make sure they are the same.
    await forum.setAvailableTags(
      DEFAULT_TAGS,
      "Use the tags that are compatible with the bot."
    );
  }
}

function createForumTagData(emoji: string, name: string): GuildForumTagData {
  return {
    name,
    emoji: { id: null, name: emoji },
    moderated: true,
  };
}

const punishmentTags: Record<Punishment, GuildForumTagData> = {
  [Punishment.Ban]: DEFAULT_TAGS[0],
  [Punishment.Kick]: DEFAULT_TAGS[1],
  [Punishment.Mute]: DEFAULT_TAGS[2],
  [Punishment.Timeout]: DEFAULT_TAGS[3],
};

export function getForumTagIdByPunishment(
  forum: ForumChannel,
  punishment: Punishment
): Snowflake {
  const punishmentTag = punishmentTags[punishment];
  const tag = forum.availableTags.find(
    t =>
      t.emoji?.name === punishmentTag.emoji?.name &&
      t.name === punishmentTag.name
  )?.id;

  if (typeof tag === "undefined") {
    throw new InfractionForumErrors.TagNotFound(forum.id, punishment);
  }

  return tag;
}

const durationFormatter = new DurationFormatter();

export async function createThread(infraction: UnsavedInfraction) {
  const forum = await getInfractionForum(infraction.guildId);
  const moderatorUser = await client.users.fetch(infraction.moderator.id);
  const targetUser = await client.users.fetch(infraction.target.id);

  const { emoji, pastTenseVerb } = getPunishmentUIElements(
    infraction.punishment
  );

  const thread = await forum.threads.create({
    name: createPostName(infraction.punishment, targetUser, moderatorUser),
    message: {
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${moderatorUser.tag} (ID ${moderatorUser.id})`,
            iconURL:
              moderatorUser.avatarURL({ forceStatic: true, size: 16 }) ??
              void 0,
          })
          .setThumbnail(targetUser.avatarURL({ size: 128 }))
          .setDescription(
            `${emoji} **${pastTenseVerb}** ${targetUser.tag} (ID \`${targetUser.id}\`)` +
              `:page_facing_up: **Reason:** ${infraction.reason}`
          )
          .setFooter({
            text: `ID: ${infraction.id}${
              typeof infraction.duration !== "undefined"
                ? `| Duration: ${durationFormatter.format(infraction.duration)}`
                : ""
            }`,
          }),
      ],
      components: [],
    },
    appliedTags: [getForumTagIdByPunishment(forum, infraction.punishment)],
  });

  return thread;
}

function createPostName(
  punishment: Punishment,
  targetUser: User,
  moderatorUser: User
): string {
  const { pastTenseVerb } = getPunishmentUIElements(punishment);

  let postName = `${targetUser.tag} (${
    targetUser.id
  }) was ${pastTenseVerb.toLowerCase()}`;
  if (typeof moderatorUser !== "undefined") {
    postName += ` by ${moderatorUser.tag} (${moderatorUser.id})`;
  }

  return postName;
}
