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

@Entity()
export class InfractionForumConfig {
  @PrimaryColumn()
  guildId!: Snowflake;

  @Column()
  forumId!: Snowflake;
}

const source = Container.get(DataSource);
const configs = source.getRepository(InfractionForumConfig);

const client = Container.get(Client);

export async function getInfractionForum(guildId: Snowflake) {
  const config = await configs.findOneBy({ guildId });

  if (config === null) {
    throw new Error(
      `No infractions forum configured for guild (\`${guildId}\`)`
    );
  }

  const channel = await client.channels.fetch(config.forumId);
  if (channel === null) {
    throw new Error(
      `Could not find channel (\`${config.forumId}\`) for guild (\`${guildId}\`) infractions forum.`
    );
  }

  const guildChannel = await channel.fetch();
  if (guildChannel.type !== ChannelType.GuildForum) {
    throw new Error(
      `Channel (\`${config.forumId}\`) in guild (\`${guildId}\`) is not a forum.`
    );
  }

  return guildChannel;
}

const DEFAULT_TAGS: GuildForumTagData[] = [
  createForumTagData(PUNISHMENT_EMOJIS[Punishment.BAN], "Punishment: Ban"),
  createForumTagData(PUNISHMENT_EMOJIS[Punishment.KICK], "Punishment: Kick"),
  createForumTagData(PUNISHMENT_EMOJIS[Punishment.MUTE], "Punishment: Mute"),
  createForumTagData(
    PUNISHMENT_EMOJIS[Punishment.TIMEOUT],
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
  [Punishment.BAN]: DEFAULT_TAGS[0],
  [Punishment.KICK]: DEFAULT_TAGS[1],
  [Punishment.MUTE]: DEFAULT_TAGS[2],
  [Punishment.TIMEOUT]: DEFAULT_TAGS[3],
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
    throw new Error(
      `Tag for punishment (\`${punishment}\`) not found in forum (\`${forum.id}\`)`
    );
  }

  return tag;
}
