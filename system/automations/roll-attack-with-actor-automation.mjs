import RollAttackAutomation from "./roll-attack-automation.mjs";
import { DataHelper } from "../helpers/data.mjs";
import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";

const fields = foundry.data.fields;
export default class RollAttackWithActorAutomation extends RollAttackAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "rollAttackWithActor";
  }

  async execute(event) {
    const currentExecution = await this.applyBoostsAndLimits();
    if (!currentExecution)
      return;

    let attribute = await this.getAttributeToUse();
    if (!attribute)
      return;

    let currentActor = game.user.character ?? game.canvas.tokens.controlled[0]?.actor;
    if (!currentActor) return;

    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${attribute}.label`)]: currentActor.system.attributes[attribute].value,

      ...currentActor.system.bonuses[attribute]
    };
    if (this.rollBonus)
      breakdown[this.name] = this.rollBonus;
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