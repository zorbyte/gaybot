import { Container } from "typedi";
import { DataSource } from "typeorm";

import { Member } from "./members/member.entity.js";
import { Infraction } from "./moderation/infractions/infraction.entity.js";
import { Ticket } from "./tickets/ticket.entity.js";
import { TranscriptMessage } from "./transcripts/transcript_message.entity.js";

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
