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

    let attribute = currentExecution.attribute;
    if (attribute.length == 0) {
      ui.notifications.error("You need to have an attribute selected for the automation.");
      return;
    }
    if (attribute.length == 1)
      attribute = attribute[0];
    else if (attribute.length > 1) {
      let btnIndex = 0;
      const buttons = [
        ...attribute.map((at) => {
          const btn = Object.assign({
            label: at,
            // icon: icon,
            action: at,
            callback: () => at,
          });
          btnIndex++;
          return btn;
        })
      ];
      attribute = await foundry.applications.api.DialogV2.wait({
        content: "",
        buttons,
        rejectClose: false,
        modal: true,
        classes: ['roll-application', 'choices-dialog'],
        position: {
          width: 400
        },
        window: { title: "Select the attribute" },
      });
    }

    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${attribute}.label`)]: this.actor.system.attributes[attribute].value,

      ...this.actor.system.bonuses[`system.attributes.${attribute}.value`]
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