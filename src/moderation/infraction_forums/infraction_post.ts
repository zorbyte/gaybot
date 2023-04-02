import { Client, EmbedBuilder, Snowflake, User } from "discord.js";
import ms from "ms";
import { Container } from "typedi";
import { Column, DataSource, Entity, OneToMany, PrimaryColumn } from "typeorm";

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

export async function getInfractionForumPost(threadId: Snowflake) {
  return posts.findOne({
    where: { threadId: threadId },
    relations: {
      infractions: true,
    },
  });
}

export async function findPostsByInfractionIds(infractionIds: Snowflake[]) {
  const found = await posts
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.infractions", "inf")
    .where(
      qb =>
        // This gets the post IDs that are on the infractions whose IDs are
        // listed in infraction IDs. It also ensures that the possibility of duplicates
        // doesn't occur, as a post can have multiple infractions.
        // It then returns to the main query where it checks if
        // the current post ID (post.threadId) is in the list of
        // post IDs that the discovered infractions are associated with.
        // If this condition passes, then that post will be selected,
        "post.threadId IN" +
        qb
          .subQuery()
          .distinctOn(["infraction.postId"])
          .select("infraction.postId")
          .from(Infraction, "infraction")
          .where("infraction.id IN (:...infractionIds)", { infractionIds })
          .getQuery()
    )
    .getMany();

  return found;
}

export async function createPost(infraction: UnsavedInfraction) {
  const thread = await createThread(infraction);
  const post = posts.create();

  post.threadId = thread.id;
  post.infractions = [infraction as InfractionWithForumPost];

  return post;
}

export async function addInfractionToPost(
  threadId: Snowflake,
  infraction: UnsavedInfraction
) {
  //TODO: lookup the post and add the infraction.
}

async function createThread(infraction: UnsavedInfraction) {
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
