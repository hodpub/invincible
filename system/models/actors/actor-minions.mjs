import InvincibleActorBase from './base-actor.mjs';

export default class InvincibleMinions extends InvincibleActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'INVINCIBLE.Actor.Minions',
  ];

  prepareDerivedData() {
    super.prepareDerivedData();
    this.derived.health.max = 10;

    for (const attribute of Object.keys(this.attributes)) {
      this.bonuses[attribute] ??= {};
      this.bonuses[attribute][game.i18n.localize("TYPES.Actor.minions")] = Math.max(this.derived.health.value - 1, 0);
    }
  }
}
