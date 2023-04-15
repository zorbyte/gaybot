import { Snowflake } from "discord.js";
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

  @Column({ nullable: true })
  duration?: number;

  get expiry() {
    if (typeof this.duration === "undefined") return void 0;
    return new Date(this.createdAt.getTime() + this.duration);
  }

  @Column({ nullable: true })
  evidenceUrl?: string;

  // In future when we add audit log support, the nullable
  // functionality of this will be used.
  @OneToOne(() => Member, { nullable: true })
  @JoinColumn()
  moderator!: Member;

  @OneToMany(() => Member, member => member.infractions)
  @JoinColumn()
  target!: Member;

  @Column({ nullable: true })
  removedRoles?: Snowflake[];

  @OneToOne(() => Transcript, { nullable: true })
  @JoinColumn()
  infringementTranscript?: Transcript;

  @OneToOne(() => Ticket, { nullable: true })
  @JoinColumn()
  ticket?: Ticket;

  @ManyToOne(() => InfractionForumPost, e => e.infractions)
  forumPost!: InfractionForumPost;

  @Column()
  createdAt!: Date;
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
      | "expiry"
      | "createdAt"
    >
  >;

export interface CreateInfractionOpts {
  guildId: Snowflake;

  punishment: Punishment;
  reason: string;
  source?: InfractionSource; // TODO: Implement this feature.
  duration?: number;
  evidenceUrl?: string;

  moderatorId: Snowflake;
  targetId: Snowflake;

  removedRoles?: Snowflake[];

  ticket?: Ticket;

  createdAt: Date;
}

const source = Container.get(DataSource);
const infractions = source.getRepository(Infraction);

export async function createInfraction(opts: CreateInfractionOpts) {
  const inf = infractions.create();
  inf.id = await nanoid(9);
  inf.guildId = opts.guildId;

  inf.punishment = opts.punishment;
  inf.reason = opts.reason;

  inf.duration = opts.duration;

  inf.source = InfractionSource.User;
  inf.moderator = await findOrCreateMember(opts.moderatorId, opts.guildId);
  inf.target = await findOrCreateMember(opts.targetId, opts.guildId);

  inf.createdAt = opts.createdAt;

  inf.ticket = opts.ticket;

  // TODO: Handle transcripts here.
  // This will be done by collecting all the messages the user sent in the guild within the last hour.

  inf.forumPost = await createPost(inf);

  return inf;
}
