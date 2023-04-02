import { Client, EmbedBuilder, Snowflake, User } from "discord.js";
import ms from "ms";
import { Container } from "typedi";
import { DataSource, Entity, OneToMany, PrimaryColumn } from "typeorm";

import { Infraction, UnsavedInfraction } from "../infractions/infraction.js";
import { getPunishmentUIElements, Punishment } from "../punishment.js";

import {
  getForumTagIdByPunishment,
  getInfractionForum,
} from "./infraction_forum.js";

@Entity()
export class InfractionForumPost {
  @PrimaryColumn()
  threadId!: Snowflake;

  @OneToMany(() => Infraction, inf => inf.forumPost)
  infractions!: Infraction[];
}

const source = Container.get(DataSource);
const posts = source.getRepository(InfractionForumPost);

const client = Container.get(Client);

type InfractionWithForumPost = UnsavedInfraction &
  Required<Pick<UnsavedInfraction, "forumPost">>;

export async function createPost(infraction: UnsavedInfraction) {
  const thread = await createThread(infraction);
  const post = posts.create();

  post.threadId = thread.id;
  post.infractions = [infraction as InfractionWithForumPost];

  return post;
}

async function createThread(infraction: UnsavedInfraction) {
  const forum = await getInfractionForum(infraction.guildId);
  const moderatorUser = await client.users.fetch(infraction.moderator.id);
  const targetUser = await client.users.fetch(infraction.target.id);

  // let actor =
  //   opts.source === InfractionSource.AUTO_MOD
  //     ? "Auto Moderator"
  //     : opts.source === InfractionSource.GAYBOT
  //     ? "GayBot Auto Moderator"
  //     : "";

  // let moderatorUser: User | undefined;
  // if (typeof opts.moderatorId !== "undefined") {
  //   moderatorUser = await client.users.fetch(opts.moderatorId);
  //   actor = `${moderatorUser.tag} (ID \`${opts.moderatorId}\`)`;
  // }

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
                ? `| Duration: ${ms(infraction.duration, { long: true })}`
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
