import {
  Client,
  EmbedBuilder,
  ForumChannel,
  Snowflake,
  User,
} from "discord.js";
import { Container } from "typedi";
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

import { type CreateInfractionOpts } from "../infractions/create.js";
import { Infraction } from "../infractions/infraction.entity.js";
import { InfractionSource } from "../infractions/source.js";
import {
  PAST_TENSE_PUNISHMENT_VERBS,
  PUNISHMENT_EMOJIS,
  PUNISHMENT_NOUNS,
} from "../punishment.js";

import {
  getForumTagIdByPunishment,
  getInfractionForum,
} from "./infraction_forum.js";

@Entity()
export class InfractionForumPost {
  @PrimaryColumn()
  postId!: Snowflake;

  /** User ID of the target */
  @Column()
  targetId!: Snowflake;

  @OneToMany(() => Infraction, inf => inf.forumEntry)
  infractions!: Infraction[];
}

const client = Container.get(Client);

type CreatePostOpts = CreateInfractionOpts;

export async function createPost(opts: CreatePostOpts) {
  const forum = await getInfractionForum(opts.guildId);

  const targetUser = await client.users.fetch(opts.targetId);

  const emoji = PUNISHMENT_EMOJIS[opts.punishment];
  const noun = PUNISHMENT_NOUNS[opts.punishment];
  const verb = PAST_TENSE_PUNISHMENT_VERBS[opts.punishment];
  let postName = `${targetUser.tag} (${targetUser.id}) was ${verb}`;

  let actor =
    opts.source === InfractionSource.AUTO_MOD
      ? "Auto Moderator"
      : opts.source === InfractionSource.GAYBOT
      ? "GayBot Auto Moderator"
      : "";

  let moderatorUser: User | undefined;
  if (typeof opts.moderatorId !== "undefined") {
    moderatorUser = await client.users.fetch(opts.moderatorId);
    postName += ` by ${moderatorUser.tag} (${opts.moderatorId})`;
    actor = `${moderatorUser.tag} (ID \`${opts.moderatorId}\`)`;
  }

  const thread = await forum.threads.create({
    name: postName,
    message: {
      embeds: [
        {
          title: postName,
          description:
            `:hammer: **Punishment:** ${emoji} ${noun} (ID \`${opts.punishment}\`)\n` +
            `:page_facing_up: **Reason:** ${opts.reason}\n` +
            `:bust_in_silhouette: **Actor:** ${actor}\n`,
        },
      ],
    },
    appliedTags: [getForumTagIdByPunishment(forum, opts.punishment)],
  });
}
