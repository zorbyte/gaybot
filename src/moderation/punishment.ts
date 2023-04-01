export enum Punishment {
  BAN,
  KICK,
  MUTE,
  TIMEOUT,
}

export const PUNISHMENT_EMOJIS: Record<Punishment, string> = {
  [Punishment.BAN]: "🔨",
  [Punishment.KICK]: "👢",
  [Punishment.MUTE]: "🔇",
  [Punishment.TIMEOUT]: "💤",
};

export const PUNISHMENT_NOUNS: Record<Punishment, string> = {
  [Punishment.BAN]: "Ban",
  [Punishment.KICK]: "Kick",
  [Punishment.MUTE]: "Mute",
  [Punishment.TIMEOUT]: "Timeout",
};

export const PAST_TENSE_PUNISHMENT_VERBS: Record<Punishment, string> = {
  [Punishment.BAN]: "banned",
  [Punishment.KICK]: "kicked",
  [Punishment.MUTE]: "muted",
  [Punishment.TIMEOUT]: "timed out",
};

export function getPunishmentUIElements(punishment: Punishment) {
  return {
    emoji: PUNISHMENT_EMOJIS[punishment],
    noun: PUNISHMENT_NOUNS[punishment],
    pastTenseVerb: PAST_TENSE_PUNISHMENT_VERBS[punishment],
  };
}
