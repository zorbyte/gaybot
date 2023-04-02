import type { Snowflake } from "discord.js";
import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";

import { Transcript } from "./transcript.js";

@Entity()
export class TranscriptMessage {
  @PrimaryColumn()
  messageId!: Snowflake;

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

  @ManyToOne(() => Transcript, transcript => transcript.messages)
  transcript!: Transcript;
}
