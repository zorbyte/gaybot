import { Snowflake } from "discord.js";
import { Container } from "typedi";
import { DataSource } from "typeorm";

import { Member } from "./member.entity.js";

const source = Container.get(DataSource);
const members = source.getRepository(Member);

export async function findOrCreateMember(
  userId: Snowflake,
  guildId: Snowflake
) {
  let m = await members.findOneBy({ id: userId, guildId: guildId });
  if (m !== null) return m;

  m = members.create();
  m.id = userId;
  m.guildId = guildId;
  return m;
}
