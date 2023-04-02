import {
  ChannelType,
  Client,
  ForumChannel,
  GuildForumTagData,
  Snowflake,
} from "discord.js";
import { Container } from "typedi";
import { Column, DataSource, Entity, PrimaryColumn } from "typeorm";

import { Punishment, PUNISHMENT_EMOJIS } from "../punishment.js";

import { InfractionForumErrors } from "./errors.js";

@Entity()
export class InfractionForum {
  @PrimaryColumn()
  guildId!: Snowflake;

  @Column()
  forumId!: Snowflake;
}

const source = Container.get(DataSource);
const forums = source.getRepository(InfractionForum);

const client = Container.get(Client);

export async function getInfractionForum(guildId: Snowflake) {
  const config = await forums.findOneBy({ guildId });

  if (config === null) {
    throw new InfractionForumErrors.NoChannelConfigured(guildId);
  }

  const channel = await client.channels.fetch(config.forumId);
  if (channel === null) {
    throw new InfractionForumErrors.ChannelNotFound(guildId, config.forumId);
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
