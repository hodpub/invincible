import InvincibleRollDialog from "../applications/dialog/roll-dialog.mjs";
import { InvincibleChatMessage } from "../documents/chat-message.mjs";
import { prepareActiveEffectCategories } from '../helpers/effects.mjs';

const { api, sheets } = foundry.applications;
const TextEditor = foundry.applications.ux.TextEditor.implementation;
const { DialogV2 } = foundry.applications.api;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class InvincibleActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['invincible', 'actor'],
    position: {
      width: 920,
      height: 680,
    },
    actions: {
      onEditImage: this._onEditImage,
      viewDoc: this._viewDoc,
      createDoc: this._createDoc,
      deleteDoc: this._deleteDoc,
      toggleEffect: this._toggleEffect,
      roll: this._onRoll,
    },
    // Custom property that's merged into `this.options`
    // dragDrop: [{ dragSelector: '.draggable', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/invincible/templates/actor/header.hbs',
    },
    tabs: {
      // Foundry-provided generic template
      template: 'templates/generic/tab-navigation.hbs',
    },
    portrait: {
      template: 'systems/invincible/templates/actor/portrait.hbs',
    },
    personal: {
      template: 'systems/invincible/templates/actor/personal.hbs',
      scrollable: [""],
    },
    features: {
      template: 'systems/invincible/templates/actor/features.hbs',
      scrollable: [""],
    },
    biography: {
      template: 'systems/invincible/templates/actor/biography.hbs',
      scrollable: [""],
    },
    gear: {
      template: 'systems/invincible/templates/actor/gear.hbs',
      scrollable: [""],
    },
    spells: {
      template: 'systems/invincible/templates/actor/spells.hbs',
      scrollable: [""],
    },
    effects: {
      template: 'systems/invincible/templates/actor/effects.hbs',
      scrollable: [""],
    },
    powers: {
      template: 'systems/invincible/templates/actor/powers.hbs',
      scrollable: [""],
    },
    talents: {
      template: 'systems/invincible/templates/actor/talents.hbs',
      scrollable: [""],
    },
    injuries: {
      template: 'systems/invincible/templates/actor/injuries.hbs',
      scrollable: [""],
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'tabs'];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Control which parts show based on document subtype
    switch (this.document.type) {
      case 'superhero':
      case 'npc':
        options.parts.push('powers', 'talents', 'injuries', 'effects', 'portrait', 'biography', 'personal');
        break;
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    // Output initialization
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      // Add the actor document.
      actor: this.actor,
      // Add the actor's data to context.data for easier access, as well as flags.
      system: this.actor.system,
      flags: this.actor.flags,
      // Adding a pointer to CONFIG.INVINCIBLE
      config: CONFIG.INVINCIBLE,
      tabs: this._getTabs(options.parts),
      // Necessary for formInput and formFields helpers
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
      currentType: this.actor.type.charAt(0).toUpperCase() + this.actor.type.slice(1),
    };

    // Offloading context prep to a helper function
    await this._prepareItems(context);

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'features':
      case 'spells':
      case 'gear':
      case 'portrait':
      case 'personal':
      case 'powers':
      case 'talents':
      case 'injuries':
        context.tab = context.tabs[partId];
        break;
      case 'biography':
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await this._enrich(this.actor.system.biography);
        break;
      case 'effects':
        context.tab = context.tabs[partId];
        // Prepare active effects
        context.effects = prepareActiveEffectCategories(
          // A generator that returns all effects stored on the actor
          // as well as any items
          this.actor.allApplicableEffects()
        );
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
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'powers';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        tooltip: 'INVINCIBLE.Actor.Tabs.',
      };
      switch (partId) {
        case 'header':
        case 'tabs':
          return tabs;
        case 'biography':
          tab.id = 'biography';
          tab.tooltip += 'Biography';
          tab.icon = "fa-solid fa-book";
          break;
        case 'portrait':
          tab.id = 'portrait';
          tab.tooltip += 'Portrait';
          tab.icon = "fa-solid fa-image";
          break;
        case 'personal':
          tab.id = 'personal';
          tab.tooltip += 'Personal';
          tab.icon = "fa-solid fa-user";
          break;
        case 'powers':
          tab.id = 'powers';
          tab.tooltip += 'Powers';
          tab.icon = "fa-solid fa-bolt";
          break;
        case 'talents':
          tab.id = 'talents';
          tab.tooltip += 'Talents';
          tab.icon = "fa-solid fa-brush";
          break;
        case 'injuries':
          tab.id = 'injuries';
          tab.tooltip += 'Injuries';
          tab.icon = "fa-solid fa-skull-crossbones";
          break;
        case 'gear':
          tab.id = 'gear';
          tab.tooltip += 'Gear';
          tab.icon = "fa-solid fa-toolbox";
          break;
        case 'effects':
          tab.id = 'effects';
          tab.tooltip += 'Effects';
          tab.icon = "fa-solid fa-atom";
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  async _prepareItems(context) {
    // Initialize containers.
    // You can just use `this.document.itemTypes` instead
    // if you don't need to subdivide a given type like
    // this sheet does with spells
    const powers = {};
    const injuries = [];
    const talents = [];
    const drawbacks = [];

    const powerSources = this.document.items.filter(i => i.type === "powerSource");
    const others = this.document.items.filter(i => i.type !== "powerSource");
    for (const ps of powerSources) {
      ps.enriched = await this._enrich(ps.system.description);
      powers[ps.id] = {
        powerSource: ps,
        powers: []
      };
    }

    // Iterate through items, allocating to containers
    for (let i of others) {
      i.enriched = await this._enrich(i.system.description);

      if (i.type === "power") {
        powers[i.system.powerSource ?? powerSources[0].id].powers.push(i);
        continue;
      }
      if (i.type === "criticalInjury") {
        injuries.push(i);
        continue;
      }
      if (i.type === "talent") {
        talents.push(i);
        continue;
      }
      if (i.type === "drawback") {
        drawbacks.push(i);
        continue;
      }
    }

    for (const [key, value] of Object.entries(powers)) {
      powers[key].powers = value.powers.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    }

    // Sort then assign
    context.powers = Object.values(powers).sort((a, b) => (a.powerSource.sort || 0) - (b.powerSource.sort || 0));
    context.injuries = injuries.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.talents = talents.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.drawbacks = drawbacks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   * @override
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#disableOverrides();
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
   * @this InvincibleActorSheet
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
   * @this InvincibleActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    doc.sheet.render(true);
  }

  /**
   * Handles item deletion
   *
   * @this InvincibleActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    await doc.delete();
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this InvincibleActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createDoc(event, target) {
    // Retrieve the configured document class for Item or ActiveEffect
    const docCls = getDocumentClass(target.dataset.documentClass);
    // Prepare the document creation data by initializing it a default name.
    const docData = {
      name: docCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (['action', 'documentClass'].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(docData, dataKey, value);
    }

    // Finally, create the embedded document!
    await docCls.create(docData, { parent: this.actor });
  }

  /**
   * Determines effect parent to pass to helper
   *
   * @this InvincibleActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /**
   * Handle clickable rolls.
   *
   * @this InvincibleActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _onRoll(event, target) {
    event.preventDefault();
    const dataset = target.dataset;

    // Handle item rolls.
    switch (dataset.rollType) {
      case 'item':
        const item = this._getEmbeddedDocument(target);
        if (item) return item.roll();
      case 'attribute':
        return new InvincibleRollDialog(
          game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${dataset.attribute}.label`),
          {
            actor: this.actor,
            breakdown: {
              [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${dataset.attribute}.label`)]: this.actor.system.attributes[dataset.attribute].value,
              ...this.actor.system.bonuses[`system.attributes.${dataset.attribute}.value`]
            },
            attribute: dataset.attribute,
          }
        ).wait(event);
      case "boost":
        const flavor = game.i18n.format("INVINCIBLE.Chat.BoostRoll.Flavor", { power: dataset.power });
        return InvincibleChatMessage.sendToChat(this.actor, flavor, dataset.rollData, event);
      case "slugfest":
        return this._slugfest(event);
      case 'automation':
      default:
        const automationItem = this._getEmbeddedDocument(target);
        if (automationItem)
          return automationItem.automate(event, dataset.automationId);

        const automation = this.actor.system.automations.filter(it => it._id == dataset.automationId)[0];
        return automation.execute(event);

    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /** Helper Functions */

  /**
   * Fetches the embedded document representing the containing HTML element
   *
   * @param {HTMLElement} target    The element subject to search
   * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
   */
  _getEmbeddedDocument(target) {
    const docRow = target.closest('[data-document-class]');
    if (docRow.dataset.documentClass === 'Item') {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === 'ActiveEffect') {
      const parent =
        docRow.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(docRow?.dataset.parentId);
      return parent.effects.get(docRow?.dataset.effectId);
    } else return console.warn('Could not find document class');
  }

  /* -------------------------------------------------- */
  /*   Application Life-Cycle Events                    */
  /* -------------------------------------------------- */

  /**
   * Actions performed after a first render of the Application.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(this._getItemButtonContextOptions, "[data-document-class]");
  }

  _getItemButtonContextOptions() {
    return [
      {
        name: "INVINCIBLE.Automation.sendToChat",
        icon: "<i class=\"fa-solid fa-comment\"></i>",
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await item.sendToChat();
        },
      },
      {
        name: "Edit",
        icon: "<i class=\"fa-solid fa-fw fa-edit\"></i>",
        // condition: () => this.isEditMode,
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await item.sheet.render({ force: true });
        },
      },
      {
        name: "Delete",
        icon: "<i class=\"fa-solid fa-fw fa-trash\"></i>",
        condition: (target) => {
          let item = this._getEmbeddedDocument(target);
          return this.actor.isOwner && !item.flags["coriolis-tgd"]?.isSupply;
        },
        callback: async (target) => {
          const item = this._getEmbeddedDocument(target);
          if (!item) {
            console.error("Could not find item");
            return;
          }
          await item.deleteDialog();
        },
      },
    ]
  }

  /***************
   *
   * Drag and Drop
   *
   ***************/

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
    if (!this.actor.isOwner || !effect) return false;
    if (effect.target === this.actor)
      return this._onSortActiveEffect(event, effect);
    return aeCls.create(effect, { parent: this.actor });
  }

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   */
  async _onSortActiveEffect(event, effect) {
    /** @type {HTMLElement} */
    const dropTarget = event.target.closest('[data-effect-id]');
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.uuid === target.uuid) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      const parentId = el.dataset.parentId;
      if (
        siblingId &&
        parentId &&
        (siblingId !== effect.id || parentId !== effect.parent.id)
      )
        siblings.push(this._getEmbeddedDocument(el));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });

    // Split the updates up by parent document
    const directUpdates = [];

    const grandchildUpdateData = sortUpdates.reduce((items, u) => {
      const parentId = u.target.parent.id;
      const update = { _id: u.target.id, ...u.update };
      if (parentId === this.actor.id) {
        directUpdates.push(update);
        return items;
      }
      if (items[parentId]) items[parentId].push(update);
      else items[parentId] = [update];
      return items;
    }, {});

    // Effects-on-items updates
    for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
      await this.actor.items
        .get(itemId)
        .updateEmbeddedDocuments('ActiveEffect', updates);
    }

    // Update on the main actor
    return this.actor.updateEmbeddedDocuments('ActiveEffect', directUpdates);
  }

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.actor.isOwner) return false;
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
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== 'Item') return [];
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);
        return item;
      })
    );
    return this._onDropItemCreate(droppedItemData, event);
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData      The item data requested for creation
   * @param {DragEvent} event               The concluding DragEvent which provided the drop data
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  /********************
   *
   * Actor Override Handling
   *
   ********************/

  /**
   * Submit a document update based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {object} submitData                   Processed and validated form data to be used for a document update
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _processSubmitData(event, form, submitData) {
    const overrides = foundry.utils.flattenObject(this.actor.overrides);
    for (let k of Object.keys(overrides)) delete submitData[k];
    await this.document.update(submitData);
  }

  /**
   * Disables inputs subject to active effects
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"]`);
      if (input) {
        input.disabled = true;
      }
    }
  }

  async _enrich(text) {
    return await TextEditor.enrichHTML(
      text,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );
  }

  async _slugfest(event) {
    const slugfestFlavor = game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.label");
    const buttons = [
      {
        type: "submit", icon: "fa-solid fa-globe", label: slugfestFlavor,
        action: "slugfest",
        callback: () => {
          return {
            rollType: "slugfest",
            rollName: slugfestFlavor,
            attribute: "fighting",
            attackInfo: {
              damage: this.actor.system.derived.slugfest.max,
              minRange: 0,
              maxRange: 0
            }
          }
        }
      },
      {
        type: "submit", icon: "fa-solid fa-globe", label: game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.wreckZone", { attack: slugfestFlavor }),
        action: "slugfestWreckZone",
        callback: () => {
          return {
            rollType: "slugfest",
            rollName: game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.wreckZone", { attack: slugfestFlavor }),
            attribute: "fighting",
            attackInfo: {
              damage: this.actor.system.derived.slugfest.max,
              minRange: 0,
              maxRange: 1
            },
            bonus: {
              [game.i18n.localize("INVINCIBLE.Actor.base.FIELDS.slugfest.wreckZoneBonus")]: 2
            }
          }
        }
      },
      {
        type: "submit", icon: "fa-solid fa-person-running-fast", label: "INVINCIBLE.Actor.base.FIELDS.slugfest.charge",
        action: "charge",
        callback: () => {
          return {
            rollType: "charge",
            rollName: game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.charge"),
            attribute: "strength",
            attackInfo: {
              damage: this.actor.system.derived.slugfest.max,
              minRange: 1,
              maxRange: "Movement"
            }
          }
        }
      },
      {
        type: "submit", icon: "fa-solid fa-globe", label: game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.wreckZone", { attack: game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.charge") }),
        action: "chargeWreckZone",
        callback: () => {
          return {
            rollType: "charge",
            rollName: game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.wreckZone", { attack: game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.charge") }),
            attribute: "strength",
            attackInfo: {
              damage: this.actor.system.derived.slugfest.max,
              minRange: 1,
              maxRange: "Movement"
            },
            bonus: {
              [game.i18n.localize("INVINCIBLE.Actor.base.FIELDS.slugfest.wreckZoneBonus")]: 2
            }
          }
        }
      },
      {
        type: "submit", icon: "fa-solid fa-hand-holding", label: "INVINCIBLE.Actor.base.FIELDS.slugfest.grapple",
        action: "grapple",
        callback: () => {
          return {
            rollType: "grapple",
            rollName: game.i18n.format("INVINCIBLE.Actor.base.FIELDS.slugfest.grapple"),
            attribute: "fighting",
          }
        }
      }
    ];
    const attackType = await foundry.applications.api.DialogV2.wait({
      undefined,
      buttons,
      rejectClose: false,
      modal: true,
      classes: ['roll-application', 'choices-dialog'],
      position: {
        width: 400
      },
      window: { title: slugfestFlavor },
    });
    if (!attackType)
      return;

    return new InvincibleRollDialog(
      attackType.rollName,
      {
        actor: this.actor,
        attribute: attackType.attribute,
        breakdown: {
          [game.i18n.localize(`INVINCIBLE.Actor.base.FIELDS.attributes.${attackType.attribute}.label`)]: this.actor.system.attributes[attackType.attribute].value,
          ...this.actor.system.bonuses[`system.attributes.${attackType.attribute}.value`],
          ...attackType.bonus
        },
        attackInfo: attackType.attackInfo
      }
    ).wait(event);
  }
}
