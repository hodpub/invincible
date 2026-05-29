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
export class InvincibleChallengeActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['invincible', 'actor', 'challenge'],
    position: {
      width: 920,
      height: 680,
    },
    actions: {
      onEditImage: this._onEditImage,
    },
    form: {
      submitOnChange: true,
    },
  };

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/invincible/templates/actor/challenge.hbs',
    },
    biography: {
      template: 'systems/invincible/templates/actor/biography.hbs',
      scrollable: [""],
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'biography'];
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
      customTitle: game.i18n.localize("TYPES.Actor.challenge")
    };

    return context;
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
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'biography';
    console.log(parts);
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

  async _onDrop(event) {
    return ui.notifications.error("Challenge does not accept any kind of item");
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
}
