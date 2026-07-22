import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";
import { DataHelper } from "../helpers/data.mjs";
import BaseAutomation from "./base-automation.mjs";

const fields = foundry.data.fields;
export default class RollAttributeAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "rollAttribute";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.attribute = new fields.SetField(new fields.StringField({ required: false }));
    schema.requireAttribute = new fields.BooleanField({ initial: true });
    schema.canChangeAttribute = new fields.BooleanField({ initial: true });
    schema.rollBonus = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0 });

    schema.stressCost = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });

    return schema;
  }

  async getAttributeToUse(currentExecution) {
    let attribute = currentExecution.attribute;
    if (!Array.isArray(attribute))
      attribute = Array.from(attribute);
    if (attribute.length == 0) {
      ui.notifications.error("You need to have an attribute selected for the automation.");
      throw Error("You need to have an attribute selected for the automation.");
    }

    if (attribute.length == 1)
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
    const currentExecution = await this.applyBoostsAndLimits("modifyUsePower");
    if (!currentExecution)
      return;

    let attribute = await this.getAttributeToUse(currentExecution);
    if (!attribute)
      return;

    if (await this.checkStress(currentExecution))
      return;

    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${attribute}.label`)]: this.actor.system.attributes[attribute].value,
      ...this.actor.system.bonuses[attribute]
    };
    if (this.rollBonus)
      breakdown[this.name] = this.rollBonus;
    const rollDialog = new InvincibleRollDialog(this.name, {
      actor: this.actor,
      attribute: attribute,
      item: this.item,
      breakdown,
      attackInfo: {
        stressCost: this.stressCost,
        effects: currentExecution.effects,
      }
    });
    return rollDialog.wait(event);
  }
}