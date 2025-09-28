export class InvincibleChatMessage extends foundry.documents.ChatMessage {
  async renderHTML({ canDelete, canClose = false, ...rest } = {}) {
    let html = await super.renderHTML({ canDelete, canClose, rest });
    if (!this.rolls || !this.rolls.length)
      return html;

    let actor = game.actors.get(this.speaker.actor);
    if (game.user.isGM || actor?.isOwner || (this.author.id === game.user.id)) {
      return html;
    }

    html.querySelector(".dice-buttons")?.remove();
    return html;
  }

  static async sendToChat(actor, flavor, content, event) {
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    let rollModeChoice = { blind: false, whisper: [] };

    if (!event?.shiftKey) {
      const buttons = [
        {
          type: "submit", icon: "fa-solid fa-globe", label: "CHAT.RollPublic",
          action: CONST.DICE_ROLL_MODES.PUBLIC,
          callback: () => {
            return {
              blind: false,
              whisper: []
            }
          }
        },
        {
          type: "submit", icon: "fa-solid fa-user-secret", label: "CHAT.RollPrivate",
          action: CONST.DICE_ROLL_MODES.PRIVATE,
          callback: () => {
            return {
              blind: false,
              whisper: [game.users.activeGM]
            }
          }
        },
        {
          type: "submit", icon: "fa-solid fa-eye-slash", label: "CHAT.RollBlind",
          action: CONST.DICE_ROLL_MODES.BLIND,
          callback: () => {
            return {
              blind: true,
              whisper: [game.users.activeGM]
            }
          }
        },
        {
          type: "submit", icon: "fa-solid fa-user", label: "CHAT.RollSelf",
          action: CONST.DICE_ROLL_MODES.SELF,
          callback: () => {
            return {
              blind: false,
              whisper: [game.user]
            }
          }
        },
      ];

      rollModeChoice = await foundry.applications.api.DialogV2.wait({
        undefined,
        buttons,
        rejectClose: false,
        modal: true,
        classes: ['roll-application'],
        position: {
          width: 400
        },
        window: {
          title: `Invincilble: ${flavor}`,
          icon: "fa-solid fa-dice",
          resizable: false
        },
      });
    }

    if (!rollModeChoice)
      return;

    const data = foundry.utils.mergeObject(
      rollModeChoice,
      {
        speaker: speaker,
        flavor: flavor,
        content: content,
      }
    );
    await ChatMessage.create({ ...data });
  }
}