import RollAttributeAutomation from "./roll-attribute-automation.mjs";
import { DataHelper } from "../helpers/data.mjs";
import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";

const { DocumentUUIDField } = foundry.data.fields;
export default class RollAttackAutomation extends RollAttributeAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "rollAttack";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.baseDamage = new foundry.data.fields.NumberField({ ...DataHelper.requiredInteger, initial: 1, min: 0 });
    schema.minRange = new foundry.data.fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });
    schema.maxRange = new foundry.data.fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });

    //TODO: Add validation to ensure maxRange >= minRange
    //TODO: Add type of action (quick/full)
    //TODO: Add validation if action type is used before rolling the attack
    //TODO: Auto use the action type

    schema.postExecution = new DocumentUUIDField();

    return schema;
  }

  async viewAutomationMacro() {
    const macro = await fromUuid(this.postExecution);
    macro.sheet.render(true);
  }

  async execute(event) {
    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${this.attribute}.label`)]: this.actor.system.attributes[this.attribute].value,

      ...this.actor.system.bonuses[`system.attributes.${this.attribute}.value`]
    };
    if (this.rollBonus)
      breakdown[this.name] = this.rollBonus;
    const rollDialog = new InvincibleRollDialog(this.name, {
      actor: this.actor,
      attribute: this.attribute,
      item: this.item,
      attackInfo: {
        damage: this.baseDamage,
        minRange: this.minRange,
        maxRange: this.maxRange,
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
    await macro.execute({ speaker, actor: this.actor, event, automation: this, message });

    return message;
  }
}