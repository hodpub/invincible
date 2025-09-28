import { YearZeroRoll } from "../../../lib/yzur.js";

const { HandlebarsApplicationMixin, ApplicationV2, DialogV2 } = foundry.applications.api;
export default class InvincibleRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(
    rollName,
    {
      actor,
      item,
      breakdown = {},
      bonus = 0,
      attackInfo = undefined,
      maxPush = undefined,
      rollOptions = {},
      attribute,
    },
    options) {
    options ??= {};
    options.window ??= {};
    let title = actor ? `${actor.name} - ` : "";
    options.window.title = `Invincible: ${title}${rollName}`;
    super(options);
    this.actor = actor;
    this.item = item;
    this.breakdown = breakdown;
    this.bonus = bonus;
    this.attackInfo = attackInfo;
    this.attribute = attribute;
    this.maxPush = maxPush;
    this.rollName = rollName;
    this.rollOptions = rollOptions;
  }

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ['invincible', 'roll-dialog', 'standard-form'],
    position: {
      width: 600,
    },
    window: {
      title: "Invincible",
      icon: "fa-solid fa-dice",
      resizable: false
    },
    actions: {
      // setRollType: this._setRollType,
    },
    tag: "form",
    form: {
      handler: InvincibleRollDialog.formHandler,
      submitOnChange: true,
    },
  };

  /** @inheritdoc */
  static PARTS = {
    form: {
      template: `systems/invincible/templates/applications/dialog/roll-dialog.hbs`,
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    }
  };


  async _prepareContext() {
    const { breakdown, dice } = this.getBreakdown();
    const context = {
      buttons: [
        {
          type: "submit", icon: "fa-solid fa-globe", label: "CHAT.RollPublic",
          disabled: !this.hideAttribute && this.requireAttribute && !this.attribute,
          action: CONST.DICE_ROLL_MODES.PUBLIC
        },
        {
          type: "submit", icon: "fa-solid fa-user-secret", label: "CHAT.RollPrivate",
          disabled: !this.hideAttribute && this.requireAttribute && !this.attribute,
          action: CONST.DICE_ROLL_MODES.PRIVATE
        },
        {
          type: "submit", icon: "fa-solid fa-eye-slash", label: "CHAT.RollBlind",
          disabled: !this.hideAttribute && this.requireAttribute && !this.attribute,
          action: CONST.DICE_ROLL_MODES.BLIND
        },
        {
          type: "submit", icon: "fa-solid fa-user", label: "CHAT.RollSelf",
          disabled: !this.hideAttribute && this.requireAttribute && !this.attribute,
          action: CONST.DICE_ROLL_MODES.SELF
        },
      ],
      actor: this.actor,
      item: this.item,
      breakdown: this.breakdown,
      bonus: this.bonus,
      rollName: this.rollName,
      attackInfo: this.attackInfo,
      dice: {
        base: dice
      }
    };

    this.context = context;

    return context;
  }

  /**
   * Process form submission for the sheet
   * @this {InvincibleRollDialog}                        The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async formHandler(event, form, formData) {
    return this._formHandler(event, form, formData);
  }

  async _formHandler(event, form, formData) {
    if (event.type == "change")
      return this._updateDialog(formData);

    if (event.type == "submit")
      return this._roll(event, form, formData);

    console.error("Unhandled event type in InvincibleRollDialog:", event.type);
    return;
  }

  async _updateDialog(formData) {
    const formValues = formData.object;
    this.bonus = formValues.bonus || 0;
    console.log(this);
    this.render(true);
  }

  getBreakdown() {
    let dice = 0;
    const breakdown = Object.keys(this.breakdown).map(key => {
      const currentValue = this.breakdown[key];
      dice += currentValue;
      return { name: key, value: currentValue };
    });
    if (this.bonus) {
      breakdown.push({ name: game.i18n.localize("INVINCIBLE.Roll.bonus"), value: this.bonus });
      dice += this.bonus;
    }
    return { breakdown, dice };
  }

  async _roll(event, form, formData) {
    const { breakdown, dice } = this.getBreakdown();
    let formula = `${dice}db`;

    let attackType = undefined;
    if (this.attackInfo) {
      attackType = this.attribute == "agility" ? "shooting" : "melee";
    }

    let options = this.rollOptions;
    options.breakdown = breakdown;
    options.damage = this.attackInfo?.damage;
    options.minRange = this.attackInfo?.minRange;
    options.maxRange = this.attackInfo?.maxRange;
    options.armor = this.attackInfo?.armor;
    options.description = this.item?.system.description;
    options.item = this.item?.uuid;
    options.attackType = attackType;
    let maxPush = this.maxPush ?? this.actor.system.maxPush?.["all"] ?? this.actor.system.maxPush?.[this.attribute] ?? 1;

    let roll = await new YearZeroRoll(formula, { maxPush }, options).roll();
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const message = await roll.toMessage({
      speaker,
      flavor: this.rollName,
    }, { rollMode: event.submitter?.dataset.action ?? game.settings.get('core', 'rollMode') });
    this.result = message;

    this.close();

    await game.dice3d?.waitFor3DAnimationByMessageID(message.id);

    return this.result;
  }

  async wait(event) {
    let stopRoll = false;
    let message = "brokenBy";
    if (this.actor?.system.derived.health.max > 0 && this.actor?.system.derived.health.value == 0)
      message += "Damage";
    if (this.actor?.system.derived.resolve.max > 0 && this.actor?.system.derived.resolve.value == 0)
      message += "AndStress";
    message = message.replace("ByAnd", "By");

    if (message != "brokenBy") {
      stopRoll = !(await DialogV2.confirm({
        window: { title: this.options.window.title },
        content: `<p>${game.i18n.localize(`INVINCIBLE.Roll.${message}`)}</p>`,
        modal: true,
        rejectClose: false,
        classes: ['roll-application'],
      }));
    }

    console.log(stopRoll);
    if (stopRoll)
      return;

    if (event?.shiftKey) {
      event.submitter = {
        dataset: { action: game.settings.get('core', 'rollMode') }
      };
      await this._prepareContext();
      return this._roll({}, undefined, undefined);
    }

    return new Promise((resolve, _reject) => {
      this.addEventListener("close", async _event => {
        resolve(await this.result);
      }, { once: true });
      this.render(true);
    });
  }
}