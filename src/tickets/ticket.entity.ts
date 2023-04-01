import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Member } from "../members/member.entity.js";
import { TranscriptMessage } from "../transcripts/transcript_message.entity.js";

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  closed!: boolean;

  @Column({ nullable: true })
  expiry?: Date;

  @OneToMany(() => TranscriptMessage, msg => msg.ticket)
  transcript!: TranscriptMessage[];

  @ManyToMany(() => Member, member => member.tickets)
  @JoinTable()
  members!: Member[];
}
