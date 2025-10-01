import { unflatten } from "../../helpers/utils.mjs";

const { HandlebarsApplicationMixin, ApplicationV2, DialogV2 } = foundry.applications.api;
export default class InvincibleStuntsDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(
    message,
    stuntsMod = 0,
    customStunts = {},
    options
  ) {
    options ??= {};
    options.window ??= {};
    options.window.title = `Invincible: ${message.flavor} - Stunts`;
    super(options);
    this.rollName = message.flavor;
    this.message = message;
    this.stuntsMod = stuntsMod;
    this.roll = message.rolls[0];
    this.stuntsMax = Math.max((this.roll.stunts ?? 0) + stuntsMod, 0);
    this.stuntOptions = foundry.utils.mergeObject(customStunts, {
      "Extra Damage": {
        value: 0,
        max: 99,
        maxDisabled: false,
        minDisabled: true,
      },
      "Knockback": {
        value: 0,
        max: 1,
        maxDisabled: false,
        minDisabled: true,
      },
      "Stun": {
        value: 0,
        max: 1,
        maxDisabled: false,
        minDisabled: true,
      },
      "Bonus Move": {
        value: 0,
        max: 99,
        maxDisabled: false,
        minDisabled: true,
      },
      "Bonus Attack": {
        value: 0,
        max: 1,
        maxDisabled: false,
        minDisabled: true,
      },
      "Disarm": {
        value: 0,
        max: 1,
        maxDisabled: false,
        minDisabled: true,
      },
      "Save Bystanders": {
        value: 0,
        max: 99,
        maxDisabled: false,
        minDisabled: true,
      },
      "Your Own": {
        value: 0,
        max: 99,
        maxDisabled: false,
        minDisabled: true,
      }
    });
    if (this.roll.options.attackType == "shooting") {
      delete this.stuntOptions["Knockback"];
      delete this.stuntOptions["Stun"];
      delete this.stuntOptions["Bonus Move"];
      delete this.stuntOptions["Save Bystanders"];
    }
    else if (this.roll.options.attackType == "charge") {
      delete this.stuntOptions["Knockback"];
      delete this.stuntOptions["Stun"];
      delete this.stuntOptions["Bonus Move"];
      delete this.stuntOptions["Bonus Attack"];
      delete this.stuntOptions["Disarm"];
      delete this.stuntOptions["Save Bystanders"];
      delete this.stuntOptions["Your Own"];
      this.stuntOptions["Slam"] = {
        value: 0,
        max: 1,
        maxDisabled: false,
        minDisabled: true,
      };
    }
  }

  get stuntsCurrent() {
    return Object.values(this.stuntOptions ?? {}).reduce((a, b) => a + b.value, 0);
  }

  get stuntsAvailable() {
    return this.stuntsMax - this.stuntsCurrent;
  }

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ['invincible', 'roll-dialog', 'standard-form'],
    position: {
      width: 600,
    },
    window: {
      title: "Invincible",
      icon: "fa-solid fa-explosion",
      resizable: false
    },
    actions: {
      increase: this._increase,
      decrease: this._decrease,
      // setRollType: this._setRollType,
    },
    tag: "form",
    form: {
      handler: InvincibleStuntsDialog.formHandler,
      submitOnChange: true,
    },
  };

  /** @inheritdoc */
  static PARTS = {
    form: {
      template: `systems/invincible/templates/applications/dialog/stunts.hbs`,
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    }
  };


  async _prepareContext() {
    for (let key in this.stuntOptions) {
      const current = this.stuntOptions[key];
      current.maxDisabled = (this.stuntsAvailable <= 0) || (current.value == current.max);
      current.minDisabled = (current.value == 0);
    }

    const context = {
      buttons: [
        {
          type: "submit", icon: "fa-solid fa-explosion", label: "INVINCIBLE.Stunts.ApplyStunts",
          disabled: this.stuntsAvailable > 0,
          action: "confirm"
        }
      ],
      rollName: this.rollName,
      stunts: {
        max: this.stuntsMax,
        current: this.stuntsCurrent,
      },
      stuntOptions: this.stuntOptions,
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
      return this._updateMessage(event, form, formData);

    console.error("Unhandled event type in InvincibleRollDialog:", event.type);
    return;
  }

  async _updateDialog(formData) {
    const formValues = formData.object;
    const unflatted = unflatten(formValues);
    this.stuntOptions = unflatted.stuntOptions;
    console.log(this);
    this.render(true);
  }

  // getBreakdown() {
  //   let dice = 0;
  //   const breakdown = Object.keys(this.breakdown).map(key => {
  //     const currentValue = this.breakdown[key];
  //     dice += currentValue;
  //     return { name: key, value: currentValue };
  //   });
  //   if (this.bonus) {
  //     breakdown.push({ name: game.i18n.localize("INVINCIBLE.Roll.bonus"), value: this.bonus });
  //     dice += this.bonus;
  //   }
  //   return { breakdown, dice };
  // }

  async _updateMessage(event, form, formData) {
    let damageMultiplier = 1;
    const stuntList = Object.entries(this.stuntOptions).filter(s => s[1].value > 0).map(s => {
      if (s[0] === "Extra Damage")
        damageMultiplier += s[1].value;
      return { name: s[0], value: s[1].value };
    });
    const message = this.message;

    let roll = message.rolls[0].duplicate();
    roll.options.damage = (roll.options.damage ?? 0) * damageMultiplier;
    roll.options.stuntsList = stuntList;
    await message.update({ "rolls": [roll] });

    this.close();
    await game.dice3d?.waitFor3DAnimationByMessageID(message.id);
    return this.result;
  }

  async wait(event) {
    return new Promise((resolve, _reject) => {
      this.addEventListener("close", async _event => {
        resolve(await this.result);
      }, { once: true });
      this.render(true);
    });
  }

  static async _increase(event) {
    return this._updateValues(event, 1);
  }
  static async _decrease(event) {
    return this._updateValues(event, -1);
  }
  async _updateValues(event, value) {
    event.preventDefault();
    const dataset = event.target.closest("[data-item]").dataset;
    const updates = {
      [dataset.item]: { value: this.stuntOptions[dataset.item].value + value }
    };
    this.stuntOptions = foundry.utils.mergeObject(this.stuntOptions, updates);
    this.render(true);
  }
}