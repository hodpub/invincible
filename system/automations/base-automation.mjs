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
      open: new fields.BooleanField({ initial: true }),
    };
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