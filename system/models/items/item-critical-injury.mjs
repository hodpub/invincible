import InvincibleItemBase from './base-item.mjs';

export default class InvincibleCriticalInjury extends InvincibleItemBase {
  static LOCALIZATION_PREFIXES = [
    'INVINCIBLE.Item.base',
    'INVINCIBLE.Item.CriticalInjury',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.healingTime = new fields.StringField();
    schema.lethal = new fields.BooleanField({ initial: false });

    return schema;
  }

  get chatTemplate() {
    return "systems/invincible/templates/sidebar/chat/injury.hbs";
  };
}
