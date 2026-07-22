import BaseAutomation from "./base-automation.mjs";

const fields = foundry.data.fields;
export default class ModifyRollAttackAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "modifyRollAttack";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    delete schema.showAsSelection;

    schema.attribute = new fields.SetField(new fields.StringField());
    schema.rollBonus = new fields.NumberField();

    schema.baseDamage = new fields.NumberField();
    schema.additionalDamage = new fields.NumberField();
    schema.minRange = new fields.NumberField();
    schema.maxRange = new fields.NumberField();
    schema.actualDamage = new fields.NumberField({ initial: -1 });
    schema.stressCost = new fields.NumberField();
    schema.conditionToApply = new fields.DocumentUUIDField();
    schema.bypassArmor = new fields.NumberField({ initial: -1 });

    schema.autoModify = new fields.BooleanField({ initial: true });

    return schema;
  }

  async execute(event) {
    ui.notifications.error("You can't execute this kind of automation");
  }
}