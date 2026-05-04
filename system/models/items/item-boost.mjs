import InvincibleItemBase from './base-item.mjs';

export default class InvincibleBoost extends InvincibleItemBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'INVINCIBLE.Item.Boost',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.power = new fields.DocumentIdField({ nullable: true });
    schema.extraConfiguration = new fields.JavaScriptField();

    return schema;
  }

  prepareDerivedData(){
    super.prepareDerivedData();

    this.func = new Function("automation", this.extraConfiguration);
  }
}
