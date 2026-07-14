export class InvincibleCompendium extends foundry.applications.sidebar.apps.Compendium {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    renderUpdateKeys: ["name", "img", "ownership", "sort", "folder", "system.level"],
  });

  static _entryPartial = "systems/invincible/templates/sidebar/compendium-entry-partial.hbs";
}
