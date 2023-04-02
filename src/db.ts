import { Container } from "typedi";
import { DataSource } from "typeorm";

import { Infraction } from "./moderation/infractions/infraction.js";
import { Ticket } from "./tickets/ticket.js";
import { TranscriptMessage } from "./transcripts/transcript_message.js";
import { Member } from "./member.js";

const source = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "gay",
  password: "bot",
  database: "gaybot",
  synchronize: true,
  logging: false,
  entities: [Member, Infraction, TranscriptMessage, Ticket],
});

Container.set(DataSource, source);

export const initDB = source.initialize.bind(source);
