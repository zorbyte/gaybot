import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { TranscriptMessage } from "./transcript_message.js";

@Entity()
export class Transcript {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => TranscriptMessage, msg => msg.transcript)
  messages!: TranscriptMessage[];

  // @ManyToOne(() => Ticket, ticket => ticket.transcript)
  // ticket?: Ticket;

  // // Note that this is not related to an infringement ticket, rather this is a recording
  // // of the events that led up to an infraction.
  // @ManyToOne(() => Infraction, infraction => infraction.infringementTranscript)
  // infraction?: Infraction;
}
