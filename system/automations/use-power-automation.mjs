import { InvincibleChatMessage } from "../documents/chat-message.mjs";
import { DataHelper } from "../helpers/data.mjs";
import { enrich } from "../helpers/utils.mjs";
import BaseAutomation from "./base-automation.mjs";

const fields = foundry.data.fields;
export default class UsePowerAutomation extends BaseAutomation {
  /** @inheritdoc */
  static get TYPE() {
    return "usePower";
  }
  get SORT() {
    return 10;
  }
  get icon() {
    return "fa-solid fa-play";
  }

  static defineSchema() {
    const schema = super.defineSchema();

    schema.stressCost = new fields.NumberField({ ...DataHelper.requiredInteger, initial: 0, min: 0 });

    return schema;
  }

  async execute(event) {
    const currentExecution = await this.applyBoostsAndLimits(["modifyUsePower"]);
    if (!currentExecution)
      return;
    if (await this.checkStress(currentExecution))
      return;

    await this.applyStress(currentExecution);

    let label = this.name;
    if (label.toLocaleLowerCase().indexOf(this.item.name.toLocaleLowerCase()) == -1)
      label = `${this.item.name} - ${label}`;
    const template = "systems/invincible/templates/sidebar/chat/power-usage.hbs";
    const context = currentExecution;
    context.enriched = await enrich(this.item, "system.description");
    const content = await foundry.applications.handlebars.renderTemplate(template, context);
    return InvincibleChatMessage.sendToChat(this.actor, label, content, event);
  }
}