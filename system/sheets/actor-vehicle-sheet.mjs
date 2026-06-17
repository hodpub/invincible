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
export class InvincibleVehicleActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['invincible', 'actor', 'vehicle'],
    position: {
      width: 920,
      height: 680,
    },
    actions: {
      onEditImage: this._onEditImage,
      roll: this._onRoll,
    },
    form: {
      submitOnChange: true,
    },
  };

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/invincible/templates/actor/vehicle.hbs',
    },
    weapons: {
      template: 'systems/invincible/templates/actor/vehicleWeapons.hbs',
      scrollable: [""],
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'weapons'];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
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
      customTitle: game.i18n.localize("TYPES.Actor.vehicle")
    };

    await this._prepareItems(context);

    return context;
  }

  async _prepareItems(context) {
    const weapons = [];

    for (const i of this.document.items) {
      i.enriched = await this._enrich(i.system.description);
      weapons.push(i);
    }

    context.weapons = weapons.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  /** @override */
  async _preparePartContext(partId, context) {
    context.tab = context.tabs[partId];
    switch (partId) {
      case 'biography':
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await this._enrich(this.actor.system.biography);
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
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'weapons';
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
        case 'weapons':
          tab.id = 'weapons';
          tab.tooltip += 'weapons';
          tab.icon = "fa-solid fa-book";
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
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

  /***************
   *
   * Drag and Drop
   *
   ***************/

  async _onDropItem(event, item) {
    if (item.type != "vehicleWeapon")
      return ui.notifications.error("Vehicle only accepts Vehicle Weapons.");

    return super._onDropItem(event, item);
  }

  /********************
   *
   * Actor Override Handling
   *
   ********************/

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
        label: "INVINCIBLE.Automation.sendToChat",
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
        label: "Edit",
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
        label: "Delete",
        icon: "<i class=\"fa-solid fa-fw fa-trash\"></i>",
        visible: (target) => {
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
              ...this.actor.system.bonuses[dataset.attribute]
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
}
