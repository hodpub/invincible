import { showAutomationsDialog } from "../helpers/automations.mjs";
import { InvincibleChatMessage } from "./chat-message.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class InvincibleItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll(event) {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.formula, rollData.actor);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  static getDefaultArtwork(itemData) {
    return { img: `systems/invincible/assets/icons/${itemData.type.toLowerCase()}.svg` };
  }

  async sendToChat(event) {
    const label = this.name;
    const template = this.system.chatTemplate;
    const content = await foundry.applications.handlebars.renderTemplate(template, this);
    return InvincibleChatMessage.sendToChat(this.actor, label, content, event);
  }

  async automate(event, specificAutomationId) {
    const item = this;
    if (typeof item.system.canRunAutomation === "function") {
      const canRunAutomation = item.system.canRunAutomation();
      if (canRunAutomation instanceof foundry.data.validation.DataModelValidationFailure) {
        ui.notifications.error(canRunAutomation.message);
        return;
      }
    }

    if (specificAutomationId){
      const specificAutomation = item.system.automations[specificAutomationId];
      return await specificAutomation.execute(event);
    }

    const keys = Object.keys(item.system.automations);
    const possibleAutomations = [];
    for (const automationId of keys) {
      const automation = item.system.automations[automationId];
      if (automation.showAsSelection)
        possibleAutomations.push(item.system.automations[automationId]);
    }

    if (possibleAutomations.length == 0)
      return this.sendToChat(event);

    if (possibleAutomations.length == 1)
      return possibleAutomations[0].execute(event);

    const automationToRun = await showAutomationsDialog(possibleAutomations, item.name);
    await automationToRun.execute(event);
  }
}
