const fields = foundry.data.fields;
export default class BaseAutomation extends foundry.abstract.DataModel {
  static get metadata() {
    return {
      documentName: "Automation",
      types: invincible.automations,
    };
  }

  static #TYPES;
  /**
   * The type of this shape.
   * @type {string}
   */
  static TYPE = "";


  static defineSchema() {
    return {
      _id: new fields.DocumentIdField({ initial: () => foundry.utils.randomID() }),
      name: new fields.StringField({
        required: true,
        blank: false
      }),
      type: new fields.StringField({
        initial: () => this.TYPE,
        required: true,
        blank: false,
        readonly: true,
        validate: value => value === this.TYPE,
        validationError: `Type can only be '${this.TYPE}'.`,
      }),
      showAsSelection: new fields.BooleanField({
        initial: true
      }),
      origin: new fields.StringField(),
      extraConfiguration: new fields.JavaScriptField({}),
      open: new fields.BooleanField({ initial: true }),
    };
  }

  _initialize(options = {}) {
    super._initialize(options);

  }

  async applyBoostsAndLimits() {
    const mods = this.actor.items.filter(it => it.system.power == this.item.id);
    let modifyAutomations = [];
    let selectableMods = [];
    let currentExecution = this.toObject();

    const removeKeys = ["name", "_id", "type", "showAsSelection", "open", "autoModify"];

    for (const mod of mods) {
      const m = Object.values(mod.system.automations).filter(it => it.type == "modifyRollAttack");
      modifyAutomations = modifyAutomations.concat(m.filter(it => it.autoModify));
      selectableMods = selectableMods.concat(m.filter(it => !it.autoModify));
    }

    let choices = [];
    for (const choice of selectableMods) {
      choices.push(`<div class="form-field"><input type="checkbox" name="${choice.name}" id="${choice.name}"><label for="${choice.name}"><strong>${choice.name}<strong></label>${choice.parent.description}</div>`);
    }
    if (choices.length) {
      const choiceResult = await foundry.applications.api.DialogV2.input({
        window: { title: currentExecution.name },
        classes: ["roll-application"],
        content: choices.join(""),
        ok: {
          label: "Apply",
          icon: "fa-solid fa-floppy-disk",
        }
      });
      for (const choice of selectableMods) {
        if (!choiceResult[choice.name])
          continue;
        modifyAutomations.push(choice);
      }
    }
    currentExecution.effects = [];
    for (const mod of modifyAutomations) {
      const modification = mod.toObject();
      currentExecution.effects.push({
        name: mod.parent.parent.name,
        description: mod.parent.description,
        type: mod.parent.parent.type,
      });

      for (const key of Object.keys(modification)) {
        if (removeKeys.indexOf(key) > -1)
          continue;
        const value = modification[key];
        if ((value instanceof Array || value instanceof String)
          && value.length)
          currentExecution[key] = value;
        else if (typeof value == "number")
          currentExecution[key] = value;
      }
    }
    return currentExecution;
  }

  /**
   * The subtypes of this pseudo-document.
   * @type {Record<string, typeof PseudoDocument>}
   */
  static get TYPES() {
    return Object.values(this.metadata.types).reduce((acc, Cls) => {
      if (Cls.TYPE) {
        acc[Cls.TYPE] = Cls;
        foundry.applications.handlebars.loadTemplates([`systems/invincible/templates/item/automation-parts/${Cls.TYPE}.hbs`]);
      }
      return acc;
    }, {});
  }

  static async createNew(name) {
    let btnIndex = 0;
    const buttons = [
      ...Object.values(this.metadata.types).map((type) => {
        const btn = Object.assign({
          label: game.i18n.localize(`INVINCIBLE.Automation.Type.${type.TYPE}`),
          action: type.TYPE,
          callback: () => new type({ name }),
        });
        btnIndex++;
        return btn;
      })
    ].filter(it => it !== undefined && it.action);
    const title = game.i18n.localize(`INVINCIBLE.Automation.addNew`);

    return await foundry.applications.api.DialogV2.wait({
      undefined,
      buttons,
      rejectClose: false,
      modal: true,
      classes: ['roll-application', 'choices-dialog'],
      position: {
        width: 400
      },
      window: { title },
    });
  }

  get item() {
    return this.parent.parent;
  }

  get system() {
    return this.parent;
  }

  get actor() {
    return this.parent.parent.actor;
  }
}