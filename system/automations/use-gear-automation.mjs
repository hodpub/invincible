import RollAttributeAutomation from "./roll-attribute-automation.mjs";
import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";

const fields = foundry.data.fields;
export default class UseGearAutomation extends RollAttributeAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "useGear";
  }
  get sort() {
    return 10;
  }
  get icon() {
    return "fa-solid fa-play";
  }

  async execute(event) {
    let attribute = await this.getAttributeToUse(this);
    if (!attribute)
      return;

    const breakdown = {
      [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${attribute}.label`)]: this.actor.system.attributes[attribute].value,
      ...this.actor.system.bonuses[attribute]
    };
    if (this.rollBonus)
      breakdown[this.name] = this.rollBonus;
    const rollDialog = new InvincibleRollDialog(this.name, {
      actor: this.actor,
      attribute: attribute,
      item: this.item,
      breakdown
    });
    const message = await rollDialog.wait(event);
    if (!message || !this.item.system.singleUse)
      return message;

    ui.notifications.info("Single item used and deleted from the sheet.");

    await this.item.delete();

    return message;
  }
}