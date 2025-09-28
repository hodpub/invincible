import { INVINCIBLE } from "../config/_invincible.mjs";

const settings = {
  configuredYzeCombat: {
    config: false,
    scope: 'world',
    type: Boolean,
    default: false,
  },
};

export function registerSettings() {
  for (let k of Object.keys(settings)) {
    game.settings.register(INVINCIBLE.ID, k, settings[k]);
  }
}

export async function registerYearZeroCombatSettings(yzec) {
  if (!game.user.isGM || game.settings.get(INVINCIBLE.ID, 'configuredYzeCombat')) return;
  await yzec.register({
    initAutoDraw: true,
    initResetDeckOnCombatStart: true,
    slowAndFastActions: true,
    resetEachRound: true
  }, false);
  game.settings.set(INVINCIBLE.ID, 'configuredYzeCombat', true)
} 