import { Snowflake } from "discord.js";
import { Container } from "typedi";
import {
  Column,
  DataSource,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";

import { Infraction } from "./moderation/infractions/infraction.js";
import { Ticket } from "./tickets/ticket.js";

@Entity()
export class Member {
  @PrimaryColumn()
  id!: Snowflake;

  @Column()
  guildId!: Snowflake;

  // @Column({ default: false })
  // isModerator = false;

  @ManyToOne(() => Infraction, infraction => infraction.target)
  infractions!: Infraction[];

  @ManyToMany(() => Ticket, ticket => ticket.members)
  tickets!: Ticket[];
}

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
