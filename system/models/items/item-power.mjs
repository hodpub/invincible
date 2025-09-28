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
}