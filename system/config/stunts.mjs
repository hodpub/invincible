import { getStuntText } from "../helpers/utils.mjs";

export const STUNTS = {};

STUNTS.list = {
  "DoubleDamage": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    action: async (actor, roll) => {
      roll.options.damage = (roll.options.damage ?? 0) * 2;
      roll.options.stuntsList.push(getStuntText("DoubleDamage"));
      return roll;
    }
  },
  "Knockback": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    exclusion: ["DeadlyHit"],
    requiresActor: true,
    action: async (actor, roll) => {
      const knockbackValue = Math.ceil(actor.system.attributes.strength.value / 2);
      roll.options.stuntsList.push(getStuntText("Knockback", { value: knockbackValue }));
      return roll;
    }
  },
  "Stun": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    action: async (actor, roll) => {
      roll.options.stuntsList.push(getStuntText("Stun"));
      return roll;
    }
  },
  "BangHeads": {
    max: 99,
    maxDisabled: false,
    minDisabled: true,
    requiresActor: true,
    action: async (actor, roll, value) => {
      const damage = Math.ceil(actor.system.attributes.strength.value / 2);
      roll.options.stuntsList.push(getStuntText("BangHeads", { value: value, damage: damage }));
      return roll;
    }
  },
  "Trap": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    action: async (actor, roll) => {
      roll.options.stuntsList.push(getStuntText("Trap"));
      return roll;
    }
  },
  "Disarm": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    action: async (actor, roll) => {
      roll.options.stuntsList.push(getStuntText("Disarm"));
      return roll;
    }
  },
  "DeadlyHit": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    exclusion: ["Knockback", "BangHeads"],
    action: async (actor, roll) => {
      const modifier = Math.min(6, roll.options.damage);
      const rollInjury = await Roll.create(`1d6 + ${modifier}`).roll();
      await (await fromUuid("Compendium.invincible.rolltables.RollTable.lRIHdMV6UBdDaeae")).draw({ roll: rollInjury, });
      roll.options.stuntsList.push(getStuntText("DeadlyHit"));
      return roll;
    }
  },
  "Slam": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    requiresActor: true,
    action: async (actor, roll) => {
      const damage = Math.ceil(actor.system.attributes.strength.value / 2);
      roll.options.stuntsList.push(getStuntText("Slam", { value: damage }));
      return roll;
    }
  },
  "SpecialStunt": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    action: async (actor, roll) => {
      roll.options.stuntsList.push(getStuntText("SpecialStunt"));
      return roll;
    }
  },
  "YourOwn": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    action: async (actor, roll) => {
      roll.options.stuntsList.push(getStuntText("YourOwn"));
      return roll;
    }
  },
  "Suppressed": {
    max: 1,
    maxDisabled: false,
    minDisabled: true,
    action: async (actor, roll) => {
      roll.options.stuntsList.push(getStuntText("Suppressed"));
      return roll;
    }
  },
  "TrickShot": {
    max: 99,
    maxDisabled: false,
    minDisabled: true,
    action: async (actor, roll) => {
      roll.options.stuntsList.push(getStuntText("TrickShot"));
      return roll;
    }
  },
}

STUNTS.slugfest = [
  "DoubleDamage",
  "Knockback",
  "Stun",
  "BangHeads",
  "Trap",
  "Disarm",
  "DeadlyHit",
  "SpecialStunt",
  "YourOwn",
];

STUNTS.charge = [
  "DoubleDamage",
  "Slam",
]

STUNTS.shooting = [
  "DoubleDamage",
  "Suppressed",
  "TrickShot",
  "Disarm",
  "DeadlyHit",
  "SpecialStunt",
  "YourOwn",
];

