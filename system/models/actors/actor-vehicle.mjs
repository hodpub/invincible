import { DataHelper } from "../../helpers/data.mjs";
import { INVINCIBLE } from "../../config/_invincible.mjs";

export default class InvincibleVehicle extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["INVINCIBLE.Actor.Vehicle"];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.derived = new fields.SchemaField(
      ["health"].reduce((obj, attribute) => {
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

    schema.type = new fields.StringField({ required: true, blank: false, choices: INVINCIBLE.ACTOR.VEHICLE_TYPESchoices, initial: INVINCIBLE.ACTOR.VEHICLE_TYPES.ground });
    schema.passengers = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 1 });
    schema.maneuverability = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0 });
    schema.speed = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 1 });
    schema.armour = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0 });
    schema.cost = new fields.StringField();
    schema.biography = new fields.HTMLField();
    return schema;
  }

  async checkIfBroken(title) {
    let stopRoll = false;
    let message = "brokenBy";
    if (this.derived.health.max > 0 && this.derived.health.value == 0)
      message += "Damage";

    if (message != "brokenBy") {
      stopRoll = !(await foundry.applications.api.DialogV2.confirm({
        window: { title },
        content: `<p>${game.i18n.localize(`INVINCIBLE.Roll.${message}`)}</p>`,
        modal: true,
        rejectClose: false,
        classes: ['roll-application'],
      }));
    }

    if (stopRoll)
      throw new Error("Actor broken. Execution interrupted.")
  }
}
