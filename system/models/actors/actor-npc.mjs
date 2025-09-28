import InvincibleActorBase from './base-actor.mjs';

export default class InvincibleNPC extends InvincibleActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'INVINCIBLE.Actor.NPC',
  ];
}
