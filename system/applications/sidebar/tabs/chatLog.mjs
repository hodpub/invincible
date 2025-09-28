import { applyStunts, applyTargetDamage } from "../../../helpers/rolls.mjs";
import { applyStress } from "../../../helpers/rolls.mjs";

export class InvincibleChatLog extends foundry.applications.sidebar.tabs.ChatLog {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      actions: {
        pushRoll: this.#pushRoll,
        acceptRoll: this.#acceptRoll,
        applyTargetDamage: this.#applyTargetDamage,
      }
    }
  );

  static getMessageAndRoll(event) {
    const { messageId } = event.target.closest("[data-message-id]")?.dataset ?? {};
    let message = game.messages.get(messageId);

    // Copy the roll.
    let roll = message.rolls[0];
    return { message, roll };
  }

  static async #pushRoll(event) {
    let { message, roll } = InvincibleChatLog.getMessageAndRoll(event);

    // Delete the previous message.
    await message.delete();

    // Push the roll and send it.
    await roll.push();
    await Promise.all([
      applyStress(message, roll),
    ]);

    const newMessage = await roll.toMessage({
      speaker: message.speaker,
      flavor: message.flavor,
      // TODO: get the roll mode from the original message
      rollMode: game.settings.get('core', 'rollMode'),
    });
    await game.dice3d?.waitFor3DAnimationByMessageID(newMessage.id);
    await applyStunts(newMessage);
    return message;
  }

  static async #acceptRoll(event) {
    let { message, roll } = InvincibleChatLog.getMessageAndRoll(event);
    roll = roll.duplicate();
    roll.maxPush = 0;
    message = await message.update({ rolls: [roll.toJSON()] });
    await applyStunts(message);
    return message;
  }
  static async #applyTargetDamage(event) {
    let { message, roll } = InvincibleChatLog.getMessageAndRoll(event);
    return applyTargetDamage(message, roll);
  }
}