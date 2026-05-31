

export class InvincibleItemDirectory extends foundry.applications.sidebar.tabs.ItemDirectory {
  static _entryPartial = "systems/invincible/templates/sidebar/item-directory-entry-partial.hbs";

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    renderUpdateKeys: ["system.level"],
  });
}