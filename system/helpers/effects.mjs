/**
 * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
 * @param {ActiveEffect[]} effects    A collection or generator of Active Effect documents to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: 'temporary',
      label: game.i18n.localize('INVINCIBLE.Effect.Temporary'),
      effects: [],
    },
    passive: {
      type: 'passive',
      label: game.i18n.localize('INVINCIBLE.Effect.Passive'),
      effects: [],
    },
    inactive: {
      type: 'inactive',
      label: game.i18n.localize('INVINCIBLE.Effect.Inactive'),
      effects: [],
    },
  };

  // Iterate over active effects, classifying them into categories
  for (const e of effects) {
    if (e.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }

  // Sort each category
  for (const c of Object.values(categories)) {
    c.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }
  return categories;
}

export function checkIfActive(effects) {
  if (!effects.size)
    return null;

  for (const e of effects) {
    if (!e.disabled)
      return true;
  }
  return false;
}

export function registerActiveEffectsList() {
  Hooks.on("renderActiveEffectConfig", async (activeEffectConfig, html, data) => {
    console.log(`${CONFIG.INVINCIBLE.ID} | Adding Attribute Key options to the ActiveEffects app`);

    const effectsSection = html.querySelector("section[data-tab='changes']");
    const inputFields = effectsSection.querySelectorAll(".key input");
    const datalist = document.createElement("datalist");

    datalist.id = 'attribute-key-list';
    inputFields.forEach((inputField) => {
      inputField.setAttribute('list', 'attribute-key-list');
    });

    const effects_list = foundry.utils.flattenObject(game.i18n.translations.INVINCIBLE.Effects);

    Object.keys(effects_list).forEach(key => {
      const attributeKeyOption = document.createElement("option");
      attributeKeyOption.value = key;
      attributeKeyOption.label = effects_list[key];
      datalist.appendChild(attributeKeyOption);
    });

    effectsSection.append(datalist);
  });
}