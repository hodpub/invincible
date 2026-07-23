import { DataHelper } from "../helpers/data.mjs";
import BaseAutomation from "./base-automation.mjs";

const fields = foundry.data.fields;
export default class ModifyUsePowerAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "modifyUsePower";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    delete schema.showAsSelection;

    schema.stressCost = new fields.NumberField();
    schema.autoModify = new fields.BooleanField({ initial: true });
    schema.description = new fields.StringField();

    return schema;
  }

  async execute(event) {
    ui.notifications.error("You can't execute this kind of automation");
  }
}