import { createListAndChoices } from "../helpers/config.mjs";

export const POWERS = {};

POWERS.LEVELS = {
  basic: "basic",
  major: "major",
  massive: "massive",
  monstrous: "monstrous"
};

createListAndChoices(POWERS, "LEVELS", POWERS.LEVELS, "INVINCIBLE.Item.Power.FIELDS.level");