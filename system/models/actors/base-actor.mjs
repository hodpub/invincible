import { DataHelper } from "../../helpers/data.mjs";
import { INVINCIBLE } from "../../config/_invincible.mjs";

export default class InvincibleActorBase extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["INVINCIBLE.Actor.base"];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.attributes = new fields.SchemaField(
      Object.keys(INVINCIBLE.ACTOR.ATTRIBUTE).reduce((obj, ability) => {
        obj[ability] = new fields.SchemaField({
          value: new fields.NumberField({
            ...DataHelper.requiredInteger,
            initial: 2,
            min: 0,
            max: 12
          }),
        });
        return obj;
      }, {})
    );

    schema.derived = new fields.SchemaField(
      Object.keys(INVINCIBLE.ACTOR.DERIVED).reduce((obj, attribute) => {
        obj[attribute] = new fields.SchemaField({
          value: new fields.NumberField({
            ...DataHelper.requiredInteger,
            initial: INVINCIBLE.ACTOR.DERIVED[attribute].initial,
            min: 0
          }),
          max: new fields.NumberField({
            ...DataHelper.requiredInteger,
            initial: INVINCIBLE.ACTOR.DERIVED[attribute].initial,
          })
        });
        return obj;
      }, {})
    );
    schema.biography = new fields.HTMLField();
    schema.civilianName = new fields.StringField();
    schema.role = new fields.StringField();
    schema.appearance = new fields.StringField();
    schema.reputation = new fields.NumberField({
      ...DataHelper.requiredInteger,
      initial: 0,
      min: 0
    });
    schema.karma = new fields.NumberField({
      ...DataHelper.requiredInteger,
      initial: 0,
      min: 0
    });

    schema.occupation = new fields.StringField();
    schema.personality = new fields.StringField();
    schema.drive = new fields.StringField();
    schema.flaw = new fields.StringField();
    schema.relationships = new fields.StringField();

    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    for (const key in this.derived) {
      let value = 0;
      for (const att of INVINCIBLE.ACTOR.DERIVED[key].composition) {
        value += typeof att == "string" ? this.attributes[att].value : att.value;
      }
      value = Math.ceil(value / 2);
      value += this.derived[key].max.bonus ?? 0;
      this.derived[key].max = value;
    }

    const bonuses = this.parent.appliedEffects.reduce((acc, effect) => {
      if (effect.changes) {
        effect.changes.forEach(change => {
          const propertyKey = change.key.replace("bonus.", "");
          if (!(propertyKey in acc))
            acc[propertyKey] = {};
          let value = change.value;
          if (!isNaN(value))
            value = parseInt(value);
          acc[propertyKey][effect.parent.name] = value;
        });
      }
      return acc;
    }, {});
    this.bonuses = bonuses;
  }
}
