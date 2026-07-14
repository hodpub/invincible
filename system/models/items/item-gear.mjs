import { signedNumber } from "../../helpers/utils.mjs";
import InvincibleItemBase from './base-item.mjs';

export default class InvincibleGear extends InvincibleItemBase {
  static LOCALIZATION_PREFIXES = [
    'INVINCIBLE.Item.base',
    'INVINCIBLE.Item.Gear',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.singleUse = new fields.BooleanField({ initial: false });
    schema.cost = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });
    schema.restricted = new fields.BooleanField({ initial: false });

    return schema;
  }

  prepareDerivedData() {
    var firstAutomationId = Object.keys(this.automations)[0];
    if (!firstAutomationId)
      return;

    var firstAutomation = this.automations[firstAutomationId];
    const extraInfo = [];

    if (firstAutomation.rollBonus)
      extraInfo.push(`${game.i18n.localize("INVINCIBLE.Roll.bonus")}: ${signedNumber(firstAutomation.rollBonus)}`)

    if (firstAutomation.baseDamage)
      extraInfo.push(`${game.i18n.localize("INVINCIBLE.Roll.damage")}: ${firstAutomation.baseDamage}`)

    if (firstAutomation.minRange || firstAutomation.maxRange)
      extraInfo.push(`${game.i18n.localize("INVINCIBLE.Automation.FIELDS.rollAttack.range.label")}: ${firstAutomation.minRange}/${firstAutomation.maxRange}`)

    if (extraInfo.length)
      this.extraInfo = `(${extraInfo.join(', ')})`;
  }
}
