import { Snowflake } from "discord.js";
import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";

import { Ticket } from "../tickets/ticket.entity.js";

@Entity()
export class TranscriptMessage {
  @PrimaryColumn()
  id!: Snowflake;

  @Column({ default: false })
  edited!: boolean;

  @Column({ nullable: true, array: true })
  revisions?: string[];

  @Column({ default: false })
  deleted!: boolean;

  @Column()
  content!: string;

  @Column({ default: false })
  redacted!: boolean;

  @Column({ nullable: true })
  redactionComment?: this["redacted"] extends true ? string : void;

  @ManyToOne(() => Ticket, ticket => ticket.transcript)
  ticket!: Ticket;
}
