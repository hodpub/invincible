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

    schema.conditionToApply = new fields.DocumentUUIDField();
    schema.bypassArmor = new fields.BooleanField({ initial: false, required: true });
    //TODO: Add validation to ensure maxRange >= minRange
    //TODO: Add type of action (quick/full)
    //TODO: Add validation if action type is used before rolling the attack
    //TODO: Auto use the action type

    schema.postExecution = new fields.DocumentUUIDField();

    return schema;
  }

  async execute(event) {
    const currentExecution = await this.applyBoostsAndLimits();
    if (!currentExecution)
      return;

    let attribute = await this.getAttributeToUse(currentExecution);
    if (!attribute)
      return;

    if (await this.checkStress(currentExecution))
      return;

    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${attribute}.label`)]: this.actor.system.attributes[attribute].value,

      ...this.actor.system.bonuses[attribute]
    };
    if (this.rollBonus)
      breakdown[this.name] = this.rollBonus;

    currentExecution.baseDamage += currentExecution.additionalDamage ?? 0;
    const rollDialog = new InvincibleRollDialog(this.name, {
      actor: this.actor,
      attribute: attribute,
      item: this.item,
      attackInfo: {
        damage: currentExecution.baseDamage,
        minRange: currentExecution.minRange,
        maxRange: currentExecution.maxRange,
        stressCost: currentExecution.stressCost,
        effects: currentExecution.effects,
        actualDamage: currentExecution.actualDamage,
        conditionToApply: currentExecution.conditionToApply,
        bypassArmor: currentExecution.bypassArmor,
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