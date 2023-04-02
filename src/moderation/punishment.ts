export enum Punishment {
  Ban,
  Kick,
  Mute,
  Timeout,
}

export const PUNISHMENT_EMOJIS: Record<Punishment, string> = {
  [Punishment.Ban]: "🔨",
  [Punishment.Kick]: "👢",
  [Punishment.Mute]: "🔇",
  [Punishment.Timeout]: "💤",
};

export const PUNISHMENT_NOUNS: Record<Punishment, string> = {
  [Punishment.Ban]: "Ban",
  [Punishment.Kick]: "Kick",
  [Punishment.Mute]: "Mute",
  [Punishment.Timeout]: "Timeout",
};

export const PAST_TENSE_PUNISHMENT_VERBS: Record<Punishment, string> = {
  [Punishment.Ban]: "Banned",
  [Punishment.Kick]: "Kicked",
  [Punishment.Mute]: "Muted",
  [Punishment.Timeout]: "Timed out",
};

export function getPunishmentUIElements(punishment: Punishment) {
  return {
    emoji: PUNISHMENT_EMOJIS[punishment],
    noun: PUNISHMENT_NOUNS[punishment],
    pastTenseVerb: PAST_TENSE_PUNISHMENT_VERBS[punishment],
  };
}
