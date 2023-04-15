import { Snowflake } from "discord.js";
import { Container } from "typedi";
import { Column, DataSource, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class ModerationConfig {
  @PrimaryColumn()
  guildId!: Snowflake;

  @Column({ nullable: true })
  infractionForumId?: Snowflake;

  @Column({ nullable: true })
  muteRoleId?: Snowflake;
}

const source = Container.get(DataSource);
const configs = source.getRepository(ModerationConfig);

export async function getModerationConfig(guildId: Snowflake) {
  const config = await configs.findOne({ where: { guildId } });
  return config ?? void 0;
}
