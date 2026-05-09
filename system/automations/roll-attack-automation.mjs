import RollAttributeAutomation from "./roll-attribute-automation.mjs";
import { DataHelper } from "../helpers/data.mjs";
import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";

const fields = foundry.data.fields;
export default class RollAttackAutomation extends RollAttributeAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "rollAttack";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.baseDamage = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 1, min: 0 });
    schema.minRange = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });
    schema.maxRange = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });

    schema.actualDamage = new fields.BooleanField({ initial: true, required: true });

    schema.stressCost = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });

    schema.conditionToApply = new fields.DocumentUUIDField();
    //TODO: Add validation to ensure maxRange >= minRange
    //TODO: Add type of action (quick/full)
    //TODO: Add validation if action type is used before rolling the attack
    //TODO: Auto use the action type

    schema.postExecution = new fields.DocumentUUIDField();

    return schema;
  }

  async viewAutomationItem(event) {
    const dataset = event.target.dataset;
    const uuid = dataset.uuid;
    const item = await fromUuid(uuid);
    item.sheet.render(true);
  }

  async execute(event) {
    const currentExecution = await this.applyBoostsAndLimits();

    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${currentExecution.attribute}.label`)]: this.actor.system.attributes[currentExecution.attribute].value,

      ...this.actor.system.bonuses[`system.attributes.${currentExecution.attribute}.value`]
    };
    if (this.rollBonus)
      breakdown[this.name] = this.rollBonus;
    const rollDialog = new InvincibleRollDialog(this.name, {
      actor: this.actor,
      attribute: currentExecution.attribute,
      item: this.item,
      attackInfo: {
        damage: currentExecution.baseDamage,
        minRange: currentExecution.minRange,
        maxRange: currentExecution.maxRange,
        stressCost: currentExecution.stressCost,
        effects: currentExecution.effects,
        actualDamage: currentExecution.actualDamage,
        conditionToApply: currentExecution.conditionToApply,
      },
      breakdown
    });
    const message = await rollDialog.wait(event);
    if (!message || !this.postExecution)
      return message;

    const macro = await fromUuid(this.postExecution);
    if (!macro) {
      ui.notifications.error("INVINCIBLE.Automation.FIELDS.macro.notFound");
      return;
    }
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    await macro.execute({ speaker, actor: this.actor, event, automation: currentExecution, message });

    return message;
  }
}