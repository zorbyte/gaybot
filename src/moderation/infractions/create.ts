import { Client, Snowflake } from "discord.js";
import { nanoid } from "nanoid/async";
import { Container } from "typedi";
import { DataSource } from "typeorm";

import { findOrCreateMember } from "../../members/member_util.js";
import { getGuildConfig } from "../infraction_forums/get_forum_config.js";
import { Punishment } from "../punishment.js";

import { Infraction } from "./infraction.entity.js";
import { InfractionSource } from "./source.js";

export interface CreateInfractionOpts {
  punishment: Punishment;

  targetId: Snowflake;

  source: InfractionSource;
  moderatorId?: Snowflake;

  guildId: Snowflake;

  reason: string;
  expiry?: Date;
}

const source = Container.get(DataSource);
const infractions = source.getRepository(Infraction);

const client = Container.get(Client);

export async function createInfraction(opts: CreateInfractionOpts) {
  const conf = await getGuildConfig(opts.guildId);
  if (typeof conf === "undefined") {
    throw new Error("No infractions forum configured!");
  }

  const forum = client.channels.fetch(conf.infractionsForum);
  if (typeof forum === "undefined") {
    throw new Error("Could not find interactions forum.");
  }

  const inf = infractions.create();
  inf.id = await nanoid(9);
  inf.punishment = opts.punishment;
  inf.reason = opts.reason;
  inf.guildId = opts.guildId;
  inf.expiry = opts.expiry;
  inf.source = opts.source;
  inf.target = await findOrCreateMember(opts.targetId, opts.guildId);

  if (typeof opts.moderatorId !== "undefined") {
    inf.moderator = await findOrCreateMember(opts.moderatorId, opts.guildId);
  }
}
