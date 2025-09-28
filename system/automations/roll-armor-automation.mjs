import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";
import { DataHelper } from "../helpers/data.mjs";
import BaseAutomation from "./base-automation.mjs";

export default class RollArmorBaseAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "rollArmor";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.armor = new foundry.data.fields.NumberField({ ...DataHelper.requiredInteger, initial: 1, min: 1 });
    return schema;
  }

  async execute(event) {
    const rollDialog = new InvincibleRollDialog(this.name, {
      actor: this.actor,
      item: this.item,
      breakdown: {
        [this.item.name]: this.armor,
        ...this.actor.system.bonuses[`armour`]
      },
      attackInfo: {
        armor: this.armor,
      },
      maxPush: 0,
    });

    const result = await rollDialog.wait(event);
    return result;
  }
}