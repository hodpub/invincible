import BaseAutomation from "./base-automation.mjs";
import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";
import { DataHelper } from "../helpers/data.mjs";

const fields = foundry.data.fields;
export default class ToggleActiveEffectAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "toggleActiveEffect";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.stressCost = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });
    schema.activeEffectUuid = new fields.DocumentUUIDField();

    return schema;
  }

  async getActiveEffect() {
    if (this.activeEffectUuid)
      return await fromUuid(this.activeEffectUuid);

    const effects = this.item.effects;
    if (effects.size == 1)
      return effects.contents[0];


    let btnIndex = 0;
    const buttons = [
      ...effects.contents.map((e) => {
        const btn = Object.assign({
          label: e.name,
          action: e._id
        });
        btnIndex++;
        return btn;
      })
    ];
    const title = this.item.name;

    const effectId = await foundry.applications.api.DialogV2.wait({
      buttons,
      rejectClose: false,
      modal: true,
      classes: ['roll-application', 'choices-dialog'],
      position: {
        width: 400
      },
      window: { title },
    });

    return this.item.effects.get(effectId);
  }

  async execute(event) {
    if (this.actor.system.derived.resolve.value < this.stressCost)
      return ui.notifications.warn("You don't have enough resolve to use this.");

    const originalHealthMax = this.actor.system.derived.health.max;
    const originalResolvehMax = this.actor.system.derived.resolve.max;

    let effect = await this.getActiveEffect();

    await effect.update({ disabled: !effect.disabled });

    const updatedHealthMax = this.actor.system.derived.health.max;
    const updatedResolvehMax = this.actor.system.derived.resolve.max;

    const healthDiff = updatedHealthMax - originalHealthMax;
    const resolveDiff = updatedResolvehMax - originalResolvehMax;

    await this.actor.update({
      "system.derived.health.value": this.actor.system.derived.health.value + healthDiff,
      "system.derived.resolve.value": this.actor.system.derived.resolve.value + resolveDiff - this.stressCost,
    });
  }
}