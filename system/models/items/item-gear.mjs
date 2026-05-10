import InvincibleItemBase from './base-item.mjs';

export default class InvincibleGear extends InvincibleItemBase {
  static LOCALIZATION_PREFIXES = [
    'INVINCIBLE.Item.base',
    'INVINCIBLE.Item.Gear',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.singleUse = new fields.BooleanField({ initial: false });
    schema.cost = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });

    return schema;
  }
}
