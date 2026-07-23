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

  get SORT() { return 1000; }
  get icon() { return "fa-solid fa-bolt-auto"; }

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

  async viewAutomationItem(event) {
    const dataset = event.target.dataset;
    const uuid = dataset.uuid;
    const item = await fromUuid(uuid);
    item.sheet.render(true);
  }

  async applyBoostsAndLimits(automationsType = ["modifyRollAttack", "modifyUsePower"]) {
    const itemId = this.item.system.power ?? this.item.id;
    const mods = this.actor.items.filter(it => it.system.power == itemId);

    // Add the item itself, so modify automations from the item can be applied
    mods.push(this.item);

    let modifyAutomations = [];
    let selectableMods = [];
    let currentExecution = this.toObject();

    const removeKeys = ["name", "_id", "type", "showAsSelection", "open", "autoModify"];
    const boolKeys = ["actualDamage", "bypassArmor"];

    for (const mod of mods) {
      const m = Object.values(mod.system.automations).filter(it => automationsType.indexOf(it.type) > -1);
      modifyAutomations = modifyAutomations.concat(m.filter(it => it.autoModify));
      selectableMods = selectableMods.concat(m.filter(it => !it.autoModify));
    }

    let choices = [];
    for (const choice of selectableMods) {
      choice.showName = choice.parent.parent.id == this.item.id ? choice.name : choice.parent.parent.name;
      choice.description = choice.description ? `<p>${choice.description}</p>` : choice.parent.description;
      choices.push(`<div class="form-field"><input type="checkbox" name="${choice.name}" id="${choice.name}"><label for="${choice.name}"><strong>${choice.name}<strong></label>${choice.description}</div>`);
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
      if (!choiceResult)
        return;

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
        name: mod.showName,
        description: mod.description,
        type: mod.parent.parent.type,
      });

      for (const key of Object.keys(modification)) {
        if (removeKeys.indexOf(key) > -1)
          continue;
        const value = modification[key];
        if ((Array.isArray(value) || typeof value == "string")
          && value.length)
          currentExecution[key] = value;
        else if (boolKeys.indexOf(key) > -1) {
          if (value == -1)
            continue;
          currentExecution[key] = Boolean(value);
        }
        else if (typeof value == "number")
          currentExecution[key] = value;
      }
    }
    currentExecution.effects = currentExecution.effects.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    return currentExecution;
  }

  async checkStress(currentExecution) {
    if (this.actor.system.derived.resolve.value < currentExecution.stressCost)
      return ui.notifications.warn("You don't have enough resolve to use this.");
  }

  async applyStress(currentExecution) {
    await this.actor.update({
      "system.derived.resolve.value": this.actor.system.derived.resolve.value - currentExecution.stressCost,
    });
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