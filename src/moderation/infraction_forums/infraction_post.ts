import { Snowflake } from "discord.js";
import { Container } from "typedi";
import { DataSource, Entity, OneToMany, PrimaryColumn } from "typeorm";

import { Infraction, UnsavedInfraction } from "../infractions/infraction.js";

import { InfractionForumErrors } from "./errors.js";
import { createThread } from "./infraction_forum.js";

@Entity()
export class InfractionForumPost {
  @PrimaryColumn()
  threadId!: Snowflake;

  @OneToMany(() => Infraction, inf => inf.forumPost)
  infractions!: Infraction[];
}

const source = Container.get(DataSource);
const posts = source.getRepository(InfractionForumPost);

type InfractionWithForumPost = UnsavedInfraction &
  Required<Pick<UnsavedInfraction, "forumPost">>;

export async function getInfractionsFromPost(
  threadId: Snowflake
): Promise<Infraction[]> {
  const infracs = (
    await posts.findOne({
      select: { infractions: true },
      where: { threadId },
      relations: { infractions: true },
    })
  )?.infractions;

  if (typeof infracs === "undefined") {
    throw new InfractionForumErrors.PostNotInDatabase(threadId);
  }

  return infracs;
}

export async function findPostsByInfractionIds(infractionIds: Snowflake[]) {
  const found = await posts
    .createQueryBuilder("post")
    .innerJoinAndSelect("post.infractions", "i")
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
  infractionId: Snowflake
) {
  await posts
    .createQueryBuilder()
    .relation("infractions")
    .of(threadId)
    .add(infractionId);
}
