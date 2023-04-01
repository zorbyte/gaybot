import { Snowflake } from "discord.js";
import { Column, Entity, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";

import { Infraction } from "../moderation/infractions/infraction.entity.js";
import { Ticket } from "../tickets/ticket.entity.js";

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
