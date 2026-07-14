import { DataHelper } from "../../helpers/data.mjs";
import { INVINCIBLE } from "../../config/_invincible.mjs";

export default class InvincibleChallenge extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["INVINCIBLE.Actor.Challenge"];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

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
    schema.subtitle = new fields.StringField();
    schema.biography = new fields.HTMLField();
    return schema;
  }
}
