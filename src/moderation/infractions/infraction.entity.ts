import { Snowflake } from "discord.js";
import {
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";

import { Member } from "../../members/member.entity.js";
import { Ticket } from "../../tickets/ticket.entity.js";
import { ForumEntry } from "../infraction_forums/infraction_post.js";
import { Punishment } from "../punishment.js";

import { InfractionSource } from "./source.js";

export class Infraction {
  @PrimaryColumn()
  id!: string; // Use nanoid/async module.

  @Column()
  guildId!: Snowflake;

  @Column()
  reason!: string;

  @Column({
    enumName: "punishment",
    enum: [
      Punishment.BAN,
      Punishment.KICK,
      Punishment.MUTE,
      Punishment.TIMEOUT,
    ],
  })
  punishment!: Punishment;

  @ManyToOne(() => ForumEntry, e => e.infractions)
  forumEntry!: ForumEntry;

  @Column({
    enumName: "source",
    enum: [
      InfractionSource.GAYBOT,
      InfractionSource.AUTO_MOD,
      InfractionSource.USER,
    ],
  })
  source!: InfractionSource;

  @OneToOne(() => Ticket, { nullable: true })
  @JoinColumn()
  ticket?: Ticket;

  @OneToOne(() => Member, { nullable: true })
  @JoinColumn()
  moderator?: Member;

  @OneToMany(() => Member, member => member.infractions)
  @JoinColumn()
  target!: Member;

  @Column({ nullable: true })
  expiry?: Date;
}
