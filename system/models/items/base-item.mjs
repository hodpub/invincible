export default class InvincibleItemBase extends foundry.abstract
  .TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.HTMLField();

    schema.automations = new fields.TypedObjectField(new fields.TypedSchemaField(invincible.automations.BaseAutomation.TYPES));

    return schema;
  }

  get chatTemplate() {
    return "systems/invincible/templates/sidebar/chat/item.hbs";
  };
}
