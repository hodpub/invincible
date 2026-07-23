import BaseAutomation from "./base-automation.mjs";
import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";
import { DataHelper } from "../helpers/data.mjs";

const fields = foundry.data.fields;
export default class ToggleActiveEffectAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "toggleActiveEffect";
  }

  get SORT() {
    return 70;
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.stressCost = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });
    schema.activeEffectUuid = new fields.DocumentUUIDField();

    return schema;
  }

  async execute(event) {
    if (this.actor.system.derived.resolve.value < this.stressCost)
      return ui.notifications.warn("You don't have enough resolve to use this.");

    const originalHealthMax = this.actor.system.derived.health.max;
    const originalResolvehMax = this.actor.system.derived.resolve.max;

    if (this.activeEffectUuid) {
      let effect = await fromUuid(this.activeEffectUuid);
      await effect.update({ disabled: !effect.disabled });
    }
    else {
      const mods = this.actor.items.filter(it => it.system.power == this.item.id).map(x => x.effects.contents);
      let effects = [...this.item.effects];
      effects = effects.concat(...mods);

      let choiceResult;
      if (effects.length == 1) {
        choiceResult = { [effects[0].name]: true };
      }
      else if (event.shiftKey) {
        choiceResult = effects.reduce((all, current) => {
          all[current.name] = true;
          return all;
        }, {});
      }
      else {
        let choices = [];
        for (const choice of effects) {
          choices.push(`<div class="form-field"><input type="checkbox" name="${choice.name}" id="${choice.name}" checked><label for="${choice.name}"><strong>${choice.name}<strong></label>${choice.parent.system.description}</div>`);
        }
        choiceResult = await foundry.applications.api.DialogV2.input({
          window: { title: this.name },
          classes: ["roll-application"],
          content: choices.join(""),
          ok: {
            label: "Apply",
            icon: "fa-solid fa-floppy-disk",
          }
        });
        if (!choiceResult)
          return;
      }

      let changeEffects = [];

      for (const choice of effects) {
        if (!choiceResult[choice.name])
          continue;
        changeEffects.push(choice.update({ disabled: !choice.disabled }));
      }

      await Promise.all(changeEffects);
    }

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