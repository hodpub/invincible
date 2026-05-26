import InvincibleItemBase from './base-item.mjs';

export default class InvinciblePower extends InvincibleItemBase {
  static LOCALIZATION_PREFIXES = [
    'INVINCIBLE.Item.base',
    'INVINCIBLE.Item.Power',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.powerSource = new fields.DocumentIdField();
    schema.boosts = new fields.ArrayField(new fields.StringField());

    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    let level = -1;
    for (const automation of Object.values(this.automations)) {
      const levelCheck = automation.name.toLowerCase();
      if (!automation.showAsSelection)
        continue;

      if (levelCheck.indexOf("basic") > -1)
        level = 0;
      else if (levelCheck.indexOf("major") > -1)
        level = 1;
      else if (levelCheck.indexOf("massive") > -1)
        level = 2;
      else if (levelCheck.indexOf("mounstrous") > -1)
        level = 3;
    }

    if (level > -1)
      this.level = ["", "Major ", "Massive ", "Mounstrous "][level];
  }
}