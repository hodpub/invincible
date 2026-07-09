import { STUNTS } from "../../config/stunts.mjs";
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
    const stuntsList = STUNTS[this.roll.options.attackType];
    const defaultStunts = {};
    for (const stunt of stuntsList) {
      if (!this.message.speaker.actor && STUNTS.list[stunt].requiresActor)
        continue;

      defaultStunts[stunt] = foundry.utils.mergeObject({ value: 0 }, STUNTS.list[stunt]);
    }
    this.stuntOptions = foundry.utils.mergeObject(customStunts, defaultStunts);
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
    this.render(true);
  }

  async _updateMessage(event, form, formData) {
    const message = this.message;
    let roll = message.rolls[0].duplicate();
    let actor = game.actors.get(message.speaker.actor);
    roll.options.stuntsList = [];

    for (const stunt of Object.values(this.stuntOptions)) {
      if (stunt.value == 0)
        continue;
      roll = await stunt.action(actor, roll, stunt.value);
    }

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