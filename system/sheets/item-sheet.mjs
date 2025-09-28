import { prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { BaseAutomation } from '../automations/_automations.mjs';

const { api, sheets } = foundry.applications;
const DragDrop = foundry.applications.ux.DragDrop;

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheetV2}
 */
export class InvincibleItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  constructor(options = {}) {
    super(options);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['invincible', 'item'],
    position: {
      width: 400,
      height: 600,
    },
    actions: {
      onEditImage: this._onEditImage,
      viewDoc: this._viewEffect,
      createDoc: this._createEffect,
      deleteDoc: this._deleteEffect,
      toggleEffect: this._toggleEffect,
      createAutomation: this._createAutomation,
      deleteAutomation: this._deleteAutomation,
      automationCommand: this._automationCommand,
      createBoost: this._createBoost,
      deleteBoost: this._deleteBoost,
      setPowerSource: this._setPowerSource,
    },
    form: {
      submitOnChange: true,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '.draggable', dropSelector: null }],
    window: {
      controls: [
        {
          icon: "fa-solid fa-dna",
          label: "INVINCIBLE.Item.Power.FIELDS.powerSource.label",
          action: "setPowerSource",
          visible: this._setPowerSourceControlVisible,
        }
      ]
    }
  };

  /* -------------------------------------------- */

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/invincible/templates/item/header.hbs',
    },
    tabs: {
      // Foundry-provided generic template
      template: 'templates/generic/tab-navigation.hbs',
    },
    description: {
      template: 'systems/invincible/templates/item/description.hbs',
    },
    attributesFeature: {
      template: 'systems/invincible/templates/item/attribute-parts/feature.hbs',
    },
    attributesCriticalInjury: {
      template: 'systems/invincible/templates/item/attribute-parts/critical-injury.hbs',
    },
    attributesGear: {
      template: 'systems/invincible/templates/item/attribute-parts/gear.hbs',
    },
    attributesSpell: {
      template: 'systems/invincible/templates/item/attribute-parts/spell.hbs',
    },
    effects: {
      template: 'systems/invincible/templates/item/effects.hbs',
    },
    automations: {
      template: 'systems/invincible/templates/item/automations.hbs',
      scrollable: [""]
    },
    boosts: {
      template: 'systems/invincible/templates/item/attribute-parts/boosts.hbs',
      scrollable: [""]
    }
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'tabs', 'description'];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Control which parts show based on document subtype
    switch (this.document.type) {
      case 'feature':
        options.parts.push('attributesFeature');
        break;
      case 'gear':
        options.parts.push('attributesGear');
        break;
      case 'spell':
        options.parts.push('attributesSpell');
        break;
      case 'criticalInjury':
        options.parts.push('attributesCriticalInjury');
        break;
      case 'power':
        options.parts.push('boosts');
        break;
    }
    options.parts.push('effects', 'automations');
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      // Add the item document.
      item: this.item,
      // Adding system and flags for easier access
      system: this.item.system,
      flags: this.item.flags,
      // Adding a pointer to CONFIG.INVINCIBLE
      config: CONFIG.INVINCIBLE,
      // You can factor out context construction to helper functions
      tabs: this._getTabs(options.parts),
      // Necessary for formInput and formFields helpers
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
    };

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'attributesFeature':
      case 'attributesGear':
      case 'attributesSpell':
      case 'attributesCriticalInjury':
      case 'automations':
      case 'boosts':
        // Necessary for preserving active tab on re-render
        context.tab = context.tabs[partId];
        break;
      case 'description':
        context.tab = context.tabs[partId];
        // Enrich description info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedDescription = await TextEditor.enrichHTML(
          this.item.system.description,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.item.getRollData(),
            // Relative UUID resolution
            relativeTo: this.item,
          }
        );
        break;
      case 'effects':
        context.tab = context.tabs[partId];
        // Prepare active effects for easier access
        context.effects = prepareActiveEffectCategories(this.item.effects);
        break;
    }
    return context;
  }

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'description';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        label: 'INVINCIBLE.Item.Tabs.',
      };
      switch (partId) {
        case 'header':
        case 'tabs':
          return tabs;
        case 'description':
          tab.id = 'description';
          tab.label += 'Description';
          break;
        case 'attributesFeature':
        case 'attributesGear':
        case 'attributesSpell':
        case 'attributesCriticalInjury':
          tab.id = 'attributes';
          tab.label += 'Attributes';
          break;
        case 'effects':
          tab.id = 'effects';
          tab.label += 'Effects';
          break;
        case 'automations':
          tab.id = 'automations';
          tab.label += 'Automations';
          break;
        case 'boosts':
          tab.id = 'boosts';
          tab.label += 'Boosts';
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    new DragDrop.implementation({
      dragSelector: ".draggable",
      dropSelector: null,
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this)
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this)
      }
    }).bind(this.element);
    // You may want to add other special handling here
    // Foundry comes with a large number of utility classes, e.g. SearchFilter
    // That you may want to implement yourself.
  }

  /**************
   *
   *   ACTIONS
   *
   **************/

  /**
   * Handle changing a Document's image.
   *
   * @this InvincibleItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  /**
   * Renders an embedded document's sheet
   *
   * @this InvincibleItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewEffect(event, target) {
    const effect = this._getEffect(target);
    effect.sheet.render(true);
  }

  /**
   * Handles item deletion
   *
   * @this InvincibleItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteEffect(event, target) {
    const effect = this._getEffect(target);
    await effect.delete();
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this InvincibleItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createEffect(event, target) {
    // Retrieve the configured document class for ActiveEffect
    const aeCls = getDocumentClass('ActiveEffect');
    // Prepare the document creation data by initializing it a default name.
    // As of v12, you can define custom Active Effect subtypes just like Item subtypes if you want
    const effectData = {
      name: this.document.name,
      img: this.document.img,
    };
    // Loop through the dataset and add it to our effectData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (['action', 'documentClass'].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(effectData, dataKey, value);
    }
    console.log(effectData, this.document);

    // Finally, create the embedded document!
    await aeCls.create(effectData, { parent: this.item });
  }

  /**
   * Determines effect parent to pass to helper
   *
   * @this InvincibleItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _toggleEffect(event, target) {
    const effect = this._getEffect(target);
    await effect.update({ disabled: !effect.disabled });
  }

  static async _createAutomation(event, target) {
    const automation = await BaseAutomation.createNew(this.item.name);
    if (!automation)
      return;
    return this.item.update({ [`system.automations.${automation._id}`]: automation });
  }
  static async _deleteAutomation(event, target) {
    const automationId = this._getAutomationId(target);
    const automation = this._getAutomation(automationId);

    const type = game.i18n.localize("INVINCIBLE.Automation.Type.automation");
    const question = game.i18n.localize("AreYouSure");
    const warning = game.i18n.format("SIDEBAR.DeleteWarning", { type });
    const content = `<p><strong>${question}</strong> ${warning}</p>`;

    return foundry.applications.api.DialogV2.confirm(
      {
        content,
        yes: { callback: async () => await this.item.update({ [`system.automations.-=${automationId}`]: null }) },
        window: {
          icon: "fa-solid fa-trash",
          title: `${game.i18n.format("DOCUMENT.Delete", { type })}: ${automation.name}`
        }
      }
    );
  }

  static async _automationCommand(event, target) {
    const automation = this._getAutomation(target);
    if (typeof automation[target.dataset.command] === "function")
      return automation[target.dataset.command](event, target);

    console.error("Command not available for the automation.", { command: target.dataset.command, automation });
  }

  static async _createBoost(event, target) {
    const boosts = this.item.system.boosts ?? [];
    const data = await foundry.applications.api.DialogV2.input({
      window: { title: "Power Boost" },
      content: `<textarea rows="3" name="boost"></textarea>`,
      ok: {
        label: "Save",
        icon: "fa-solid fa-floppy-disk",
      },
      rejectClose: false,
    });
    if (!data?.boost)
      return;

    boosts.push(data.boost);
    return this.item.update({ "system.boosts": boosts });
  }

  static async _deleteBoost(event, target) {
    const boosts = this.item.system.boosts ?? [];
    const index = parseInt(target.dataset.index);
    if (isNaN(index) || index < 0 || index >= boosts.length) {
      ui.notifications.error("Invalid boost index.");
      return;
    }
    const type = game.i18n.localize("INVINCIBLE.Item.Power.FIELDS.boosts.single");
    const question = game.i18n.localize("AreYouSure");
    const warning = game.i18n.format("SIDEBAR.DeleteWarning", { type });
    const content = `<p><strong>${question}</strong> ${warning}</p>`;
    return foundry.applications.api.DialogV2.confirm(
      {
        content,
        yes: {
          callback: async () => {
            boosts.splice(index, 1);
            return this.item.update({ "system.boosts": boosts });
          }
        },
        window: {
          icon: "fa-solid fa-trash",
          title: `${game.i18n.format("DOCUMENT.Delete", { type })}`
        }
      }
    );

  }

  static async _setPowerSource(event, target) {
    const possiblePowerSources = Object.assign(
      ...this.item.parent?.items.filter(i => i.type === "powerSource").map(it => ({
        [it.id]: it.name
      }))
    );
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/invincible/templates/item/attribute-parts/power-source-control.hbs",
      {
        powerSourceList: possiblePowerSources,
        selected: this.item.system.powerSource
      });

    const response = await foundry.applications.api.DialogV2.input(
      {
        title: game.i18n.localize("INVINCIBLE.Item.Power.FIELDS.powerSource.label"),
        content: content,
      }
    );
    if (!response)
      return;

    await this.item.update({ "system.powerSource": response.powerSource });
  }

  static _setPowerSourceControlVisible() {
    return this.item.type === "power" && this.item.isEmbedded;
  }

  /** Helper Functions */

  /**
   * Fetches the row with the data for the rendered embedded document
   *
   * @param {HTMLElement} target  The element with the action
   * @returns {HTMLLIElement} The document's row
   */
  _getEffect(target) {
    const li = target.closest('.effect');
    return this.item.effects.get(li?.dataset?.effectId);
  }

  _getAutomationId(target) {
    const objectTarget = target.closest('[data-automation-id]');
    return objectTarget?.dataset?.automationId;
  }

  _getAutomation(target) {
    let automationId = target;
    if (typeof automationId != "string") {
      automationId = this._getAutomationId(target);
    }
    return this.item.system.automations[automationId];
  }
  /**
   *
   * DragDrop
   *
   */

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const li = event.currentTarget;
    if ('link' in event.target.dataset) return;

    let dragData = null;

    // Active Effect
    if (li.dataset.effectId) {
      const effect = this.item.effects.get(li.dataset.effectId);
      dragData = effect.toDragData();
    }

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) { }

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const item = this.item;
    const allowed = Hooks.call('dropItemSheetData', item, this, data);
    if (allowed === false) return;

    // Although you will find implmentations to all doc types here, it is important to keep 
    // in mind that only Active Effects are "valid" for items.
    // Actors have items, but items do not have actors.
    // Items in items is not implemented on Foudry per default. If you need an implementation with that,
    // try to search how other systems do. Basically they will use the drag and drop, but they will store
    // the UUID of the item.
    // Folders can only contain Actors or Items. So, fall on the cases above.
    // We left them here so you can have an idea of how that would work, if you want to do some kind of
    // implementation for that.
    switch (data.type) {
      case 'ActiveEffect':
        return this._onDropActiveEffect(event, data);
      case 'Actor':
        return this._onDropActor(event, data);
      case 'Item':
        return this._onDropItem(event, data);
      case 'Folder':
        return this._onDropFolder(event, data);
      case 'Macro':
        return this._onDropMacro(event, data);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const aeCls = getDocumentClass('ActiveEffect');
    const effect = await aeCls.fromDropData(data);
    if (!this.item.isOwner || !effect) return false;

    if (this.item.uuid === effect.parent?.uuid)
      return this._onEffectSort(event, effect);
    return aeCls.create(effect, { parent: this.item });
  }

  /**
   * Sorts an Active Effect based on its surrounding attributes
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   */
  _onEffectSort(event, effect) {
    const effects = this.item.effects;
    const dropTarget = event.target.closest('[data-effect-id]');
    if (!dropTarget) return;
    const target = effects.get(dropTarget.dataset.effectId);

    // Don't sort on yourself
    if (effect.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      if (siblingId && siblingId !== effect.id)
        siblings.push(effects.get(el.dataset.effectId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.item.updateEmbeddedDocuments('ActiveEffect', updateData);
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.item.isOwner) return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if (!this.item.isOwner) return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.item.isOwner) return [];
  }

  async _onDropMacro(event, data) {
    const automationId = this._getAutomationId(event.target);
    console.log(automationId, data, event.target);
    if (!automationId)
      return;
    const automation = this._getAutomation(automationId);
    const macroFields = ["macro", "postExecution"];
    if (!automation || !event.target.name || !macroFields.includes(event.target.name.split('.')[3])) {
      ui.notifications.warn(game.i18n.localize("INVINCIBLE.Automation.FIELDS.macro.error"));
      return;
    }

    await this.item.update({ [event.target.name]: data.uuid });
  }

  _prepareSubmitData(event, form, formData, updateData) {
    const details = form.getElementsByTagName("details");
    for (const detail of details) {
      if (!detail.dataset.automationId)
        continue;
      formData.object[`system.automations.${detail.dataset.automationId}.open`] = detail.open;
    }
    return super._prepareSubmitData(event, form, formData, updateData);
  }
}
