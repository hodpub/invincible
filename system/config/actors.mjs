import { createListAndChoices } from "../helpers/config.mjs";

export const ACTOR = {};

ACTOR.ATTRIBUTE = {
  fighting: "fighting",
  agility: "agility",
  strength: "strength",
  reason: "reason",
  intuition: "intuition",
  presence: "presence"
};

createListAndChoices(ACTOR, "ATTRIBUTE", ACTOR.ATTRIBUTE, "INVINCIBLE.Actor.base.FIELDS.attributes");

ACTOR.DERIVED = {
  slugfest: {
    composition: [
      ACTOR.ATTRIBUTE.strength
    ],
    initial: 2
  },
  health: {
    composition: [
      ACTOR.ATTRIBUTE.fighting,
      ACTOR.ATTRIBUTE.agility,
      ACTOR.ATTRIBUTE.strength
    ],
    initial: 2
  },
  resolve: {
    composition: [
      ACTOR.ATTRIBUTE.reason,
      ACTOR.ATTRIBUTE.intuition,
      ACTOR.ATTRIBUTE.presence
    ],
    initial: 2
  }
};

ACTOR.PROTOTYPE_TOKEN = {
  superhero: {
    actorLink: true,
    disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
    sight: {
      enabled: true,
    },
  },
  npc: {
    actorLink: true,
    disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
    sight: {
      enabled: true,
    },
  },
  minions: {
    disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
    sight: {
      enabled: true,
    },
  }
}

ACTOR.VEHICLE_TYPES = {
  ground: "ground",
  water: "water",
  aerial: "aerial",
  space: "space",
};

createListAndChoices(ACTOR, "VEHICLE_TYPES", ACTOR.VEHICLE_TYPES, "INVINCIBLE.Actor.Vehicle.FIELDS.type");