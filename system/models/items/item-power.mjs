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
    schema.level = new fields.StringField();

    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.setPowerLevel();
  }

  setPowerLevel() {
    if (this.level) {
      this.powerLevel = game.i18n.localize(`INVINCIBLE.Item.Power.FIELDS.level.${this.level}.label`);
      return;
    }

    let level = -1;
    for (const automation of Object.values(this.automations)) {
      const levelCheck = automation.name.toLowerCase();
      if (!automation.showAsSelection)
        continue;

      if (levelCheck.indexOf("basic") > -1)
        level = Math.max(0, level);
      else if (levelCheck.indexOf("major") > -1)
        level = Math.max(1, level);
      else if (levelCheck.indexOf("massive") > -1)
        level = Math.max(2, level);
      else if (levelCheck.indexOf("monstrous") > -1)
        level = Math.max(3, level);
    }

    if (level > -1)
      level = ["basic", "major", "massive", "monstrous"][level];
    else {
      level = ""
    }

    this.powerLevel = game.i18n.localize(`INVINCIBLE.Item.Power.FIELDS.level.${level}.label`);
  }
}