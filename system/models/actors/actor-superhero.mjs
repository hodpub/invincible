import InvincibleActorBase from './base-actor.mjs';
import { INVINCIBLE } from "../../config/_invincible.mjs";

export default class InvincibleSuperhero extends InvincibleActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'INVINCIBLE.Actor.Superhero',
  ];
}
