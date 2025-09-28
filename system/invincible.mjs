// Import document classes.
import { InvincibleActor } from './documents/actor.mjs';
import { InvincibleItem } from './documents/item.mjs';
import { InvincibleChatMessage } from "./documents/chat-message.mjs";
// Import sheet classes.
import { InvincibleActorSheet } from './sheets/actor-sheet.mjs';
import { InvincibleItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { INVINCIBLE } from './config/_invincible.mjs';
// Import DataModel classes
import * as models from './models/_models.mjs';
import * as automations from './automations/_automations.mjs';
import registerHandlebarsHelpers from "./helpers/handlebars.mjs";
// YZUR Lib
import { YearZeroRollManager } from '../lib/yzur.js';
import { InvincibleChatLog } from "./applications/sidebar/tabs/chatLog.mjs";
import { registerDice3D } from "./helpers/rolls.mjs";
import InvincibleRollDialog from "./applications/dialog/roll-dialog.mjs";
import { registerSettings, registerYearZeroCombatSettings } from "./helpers/settings.mjs";

const collections = foundry.documents.collections;
const sheets = foundry.appv1.sheets;

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.invincible = {
  documents: {
    InvincibleActor,
    InvincibleItem,
  },
  applications: {
    InvincibleActorSheet,
    InvincibleItemSheet,
  },
  utils: {
    rollItemMacro,
    InvincibleRollDialog,
  },
  models,
  automations
};

Hooks.once('init', function () {
  // Add custom constants for configuration.
  CONFIG.INVINCIBLE = INVINCIBLE;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d20 + @abilities.dex.mod',
    decimals: 2,
  };

  CONFIG.ui.chat = InvincibleChatLog;

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = InvincibleActor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Character/NPC as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    superhero: models.InvincibleSuperhero,
    npc: models.InvincibleNPC,
  };
  CONFIG.Item.documentClass = InvincibleItem;
  CONFIG.Item.dataModels = {
    gear: models.InvincibleGear,
    feature: models.InvincibleFeature,
    spell: models.InvincibleSpell,
    criticalInjury: models.InvincibleCriticalInjury,
    talent: models.InvincibleTalent,
    drawback: models.InvincibleDrawback,
    powerSource: models.InvinciblePowerSource,
    power: models.InvinciblePower,
  };

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  CONFIG.ChatMessage.documentClass = InvincibleChatMessage;
  CONFIG.ChatMessage.template = "systems/invincible/templates/sidebar/chat-message.hbs";

  // Register sheet application classes
  collections.Actors.unregisterSheet('core', sheets.ActorSheet);
  collections.Actors.registerSheet('invincible', InvincibleActorSheet, {
    makeDefault: true,
    label: 'INVINCIBLE.SheetLabels.Actor',
  });
  collections.Items.unregisterSheet('core', sheets.ItemSheet);
  collections.Items.registerSheet('invincible', InvincibleItemSheet, {
    makeDefault: true,
    label: 'INVINCIBLE.SheetLabels.Item',
  });

  registerSettings();

  YearZeroRollManager.register("inv", {
    "Roll.baseTemplate": `systems/invincible/templates/dice/broll.hbs`,
    "Roll.chatTemplate": `systems/invincible/templates/dice/roll.hbs`,
    "Roll.tooltipTemplate": `systems/invincible/templates/dice/tooltip.hbs`,
    "Roll.infosTemplate": `systems/invincible/templates/dice/infos.hbs`,
  });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

registerHandlebarsHelpers();
// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createDocMacro(data, slot));
  adventureImport();
});

const quickstartAdventureUuid = "Compendium.invincible.basic-data.Adventure.UPXxPs1B06jTxXq6";

async function adventureImport() {
  if (game.items.get("4X4nw1do9wEOAaLx"))
    return;

  const adventure = await fromUuid(quickstartAdventureUuid);
  adventure.sheet.render(true);
}

Hooks.on('importAdventure', async (adventure) => {
  if (adventure.uuid !== quickstartAdventureUuid)
      return;
  const scene = await fromUuid("Scene.sge0EEkIG8wuvCmB");
  scene.activate();
});

Hooks.once('diceSoNiceReady', registerDice3D);
Hooks.once('yzeCombatReady', registerYearZeroCombatSettings);

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.invincible.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'invincible.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
