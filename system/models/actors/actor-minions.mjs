import InvincibleActorBase from './base-actor.mjs';

export default class InvincibleMinions extends InvincibleActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'INVINCIBLE.Actor.Minions',
  ];

  prepareDerivedData() {
    super.prepareDerivedData();
    this.derived.health.max = 10;

    if (this.derived.health.value <= 1)
      return;

    this.bonuses["attack"] ??= {};
    this.bonuses["attack"][game.i18n.localize("TYPES.Actor.minions")] = Math.max(this.derived.health.value - 1, 0);
  }
}
