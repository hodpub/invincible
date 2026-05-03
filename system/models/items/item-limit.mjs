import InvincibleBoost from "./item-boost.mjs";

export default class InvincibleLimit extends InvincibleBoost {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'INVINCIBLE.Item.Limit',
  ];
}
