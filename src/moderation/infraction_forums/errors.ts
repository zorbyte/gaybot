import { Snowflake } from "discord.js";

import { createGaybotError } from "../../errors.js";
import { Punishment } from "../punishment.js";

export namespace InfractionForumErrors {
  export const NoChannelConfigured = createGaybotError(
    Error,
    (guildId: Snowflake) =>
      `No infractions forum configured for guild (\`${guildId}\`)`
  );

  export const ChannelNotFound = createGaybotError(
    Error,
    (guildId: Snowflake, channelId: Snowflake) =>
      `Could not find channel (\`${channelId}\`) for guild (\`${guildId}\`) infractions forum.`
  );

  export const NotAForum = createGaybotError(
    TypeError,
    (guildId: Snowflake, channelId: Snowflake) =>
      `Channel (\`${channelId}\`) in guild (\`${guildId}\`) is not a forum.`
  );

  export const TagNotFound = createGaybotError(
    Error,
    (forumId: Snowflake, punishment: Punishment) =>
      `Tag for punishment (\`${punishment}\`) not found in forum (\`${forumId}\`)`
  );
}
