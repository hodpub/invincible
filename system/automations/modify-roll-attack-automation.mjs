import BaseAutomation from "./base-automation.mjs";

const fields = foundry.data.fields;
export default class ModifyRollAttackAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "modifyRollAttack";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.attribute = new fields.SetField(new fields.StringField());
    schema.rollBonus = new fields.NumberField();

    schema.baseDamage = new fields.NumberField();
    schema.minRange = new fields.NumberField();
    schema.maxRange = new fields.NumberField();
    schema.actualDamage = new fields.BooleanField();
    schema.stressCost = new fields.NumberField();
    schema.conditionToApply = new fields.DocumentUUIDField();

    schema.autoModify = new fields.BooleanField({ initial: true });

    return schema;
  }

  async execute(event) {
    ui.notifications.error("You can't execute this kind of automation");
  }
}