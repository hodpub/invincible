import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";
import { DataHelper } from "../helpers/data.mjs";
import BaseAutomation from "./base-automation.mjs";

const { StringField, BooleanField, SetField } = foundry.data.fields;
export default class RollAttributeAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "rollAttribute";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.attribute = new SetField(new StringField({ required: false }));
    schema.requireAttribute = new BooleanField({ initial: true });
    schema.canChangeAttribute = new BooleanField({ initial: true });
    schema.rollBonus = new foundry.data.fields.NumberField({ ...DataHelper.requiredInteger, initial: 0 });

    return schema;
  }

  async getAttributeToUse() {
    let attribute = this.attribute;
    if (attribute.size == 0) {
      ui.notifications.error("You need to have an attribute selected for the automation.");
      throw Error("You need to have an attribute selected for the automation.");
    }

    if (attribute.size == 1)
      return attribute.values().next().value;

    let btnIndex = 0;
    const buttons = [
      ...attribute.map((at) => {
        const btn = Object.assign({
          label: at,
          // icon: icon,
          action: at,
          callback: () => at,
        });
        btnIndex++;
        return btn;
      })
    ];
    return foundry.applications.api.DialogV2.wait({
      content: "",
      buttons,
      rejectClose: false,
      modal: true,
      classes: ['roll-application', 'choices-dialog'],
      position: {
        width: 400
      },
      window: { title: "Select the attribute" },
    });
  }

  async execute(event) {
    let attribute = await this.getAttributeToUse();
    if (!attribute)
      return;

    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${attribute}.label`)]: this.actor.system.attributes[this.attribute].value,
      ...this.actor.system.bonuses[attribute]
    };
    if (this.rollBonus)
      breakdown[this.name] = this.rollBonus;
    const rollDialog = new InvincibleRollDialog(this.name, {
      actor: this.actor,
      attribute: attribute,
      item: this.item,
      breakdown
    });
    return rollDialog.wait(event);
  }
}