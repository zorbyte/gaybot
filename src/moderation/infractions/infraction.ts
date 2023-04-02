import { Client, Snowflake } from "discord.js";
import { nanoid } from "nanoid/async";
import { Container } from "typedi";
import {
  Column,
  DataSource,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";

import { findOrCreateMember, Member } from "../../member.js";
import { Ticket } from "../../tickets/ticket.js";
import { Transcript } from "../../transcripts/transcript.js";
import {
  createPost,
  InfractionForumPost,
} from "../infraction_forums/infraction_post.js";
import { Punishment } from "../punishment.js";

import { InfractionSource } from "./infraction_source.js";

export class Infraction {
  @PrimaryColumn()
  id!: string; // Use nanoid/async module.

  @Column()
  guildId!: Snowflake;

  @Column({
    enumName: "punishment",
    enum: [
      Punishment.Ban,
      Punishment.Kick,
      Punishment.Mute,
      Punishment.Timeout,
    ],
  })
  punishment!: Punishment;

  @Column()
  reason!: string;

  @Column({ nullable: true })
  expiry?: Date;

  // The duration, on which the expiry is generated off.
  duration?: number;

  @Column({
    enumName: "source",
    enum: [
      InfractionSource.User,
      // The following are reserved for future use:
      InfractionSource.AutoMod,
      InfractionSource.Gaybot,
    ],
    default: InfractionSource.User,
  })
  source: InfractionSource = InfractionSource.User;

  // In future when we add audit log support, the nullable
  // functionality of this will be used.
  @OneToOne(() => Member, { nullable: true })
  @JoinColumn()
  moderator!: Member;

  @OneToMany(() => Member, member => member.infractions)
  @JoinColumn()
  target!: Member;

  @OneToOne(() => Transcript, { nullable: true })
  @JoinColumn()
  infringementTranscript?: Transcript;

  @OneToOne(() => Ticket, { nullable: true })
  @JoinColumn()
  ticket?: Ticket;

  @ManyToOne(() => InfractionForumPost, e => e.infractions)
  forumPost!: InfractionForumPost;
}

export type UnsavedInfraction = Partial<Infraction> &
  Required<
    Pick<
      Infraction,
      | "id"
      | "guildId"
      | "reason"
      | "punishment"
      | "source"
      | "moderator"
      | "target"
    >
  >;

export interface CreateInfractionOpts {
  punishment: Punishment;

  // source: InfractionSource;

  guildId: Snowflake;

  targetId: Snowflake;
  moderatorId: Snowflake;

  reason: string;
  duration?: number;
}

const source = Container.get(DataSource);
const infractions = source.getRepository(Infraction);

const client = Container.get(Client);

export async function createInfraction(opts: CreateInfractionOpts) {
  const inf = infractions.create();
  inf.id = await nanoid(9);
  inf.guildId = opts.guildId;

  inf.punishment = opts.punishment;
  inf.reason = opts.reason;

  inf.duration = opts.duration;
  inf.expiry =
    typeof opts.duration !== "undefined"
      ? new Date(Date.now() + opts.duration)
      : void 0;

  inf.source = InfractionSource.User;
  inf.moderator = await findOrCreateMember(opts.moderatorId, opts.guildId);
  inf.target = await findOrCreateMember(opts.targetId, opts.guildId);

  // TODO: Handle transcripts here.

  inf.forumPost = await createPost(inf);
}
