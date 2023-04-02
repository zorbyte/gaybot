import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Member } from "../member.js";
import { Transcript } from "../transcripts/transcript.js";

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  closed!: boolean;

  @Column({ nullable: true })
  expiry?: Date;

  @OneToOne(() => Transcript)
  @JoinColumn()
  transcript!: Transcript;

  @ManyToMany(() => Member, member => member.tickets)
  @JoinTable()
  members!: Member[];
}
