import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";
import { DataHelper } from "../helpers/data.mjs";
import BaseAutomation from "./base-automation.mjs";

const { StringField, BooleanField } = foundry.data.fields;
export default class RollAttributeAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "rollAttribute";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.attribute = new StringField({ required: false });
    schema.requireAttribute = new BooleanField({ initial: true });
    schema.canChangeAttribute = new BooleanField({ initial: true });
    schema.rollBonus = new foundry.data.fields.NumberField({ ...DataHelper.requiredInteger, initial: 0 });

    return schema;
  }

  async execute(event) {
    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${this.attribute}.label`)]: this.actor.system.attributes[this.attribute].value,
      ...this.actor.system.bonuses[`system.attributes.${this.attribute}.value`]
    };
    if (this.rollBonus)
      breakdown[this.name] = this.rollBonus;
    const rollDialog = new InvincibleRollDialog(this.name, {
      actor: this.actor,
      attribute: this.attribute,
      item: this.item,
      breakdown
    });
    return rollDialog.wait(event);
  }
}