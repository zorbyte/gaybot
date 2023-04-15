import { Snowflake } from "discord.js";

import { createGaybotError } from "../errors.js";

export namespace ModerationErrors {
  export const NoPermissionsForMute = createGaybotError(
    Error,
    (guildId: Snowflake, userId: Snowflake) =>
      `Failed to mute user (\`${userId}\`) due to missing permission \`MANAGE_ROLES\` in guild (\`${guildId}\`).`
  );
}
