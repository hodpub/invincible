export class InvincibleCompendiumDirectory extends foundry.applications.sidebar.tabs.CompendiumDirectory {
  /**
   * Render Document-search matches for display.
   * @param {Set<WordTreeEntry["entry"]>} indexEntries
   * @param {HTMLElement} listEl
   * @protected
   */
  _onMatchSearchDocuments(indexEntries, listEl) {
    super._onMatchSearchDocuments(indexEntries, listEl);

    for (const entry of indexEntries) {
      const document = entry.entry ?? entry;
      const uuid = entry.uuid ?? document.uuid;
      const name = document.name ?? entry.name;
      const level = document.system?.level;
      if ((document.type !== "power") || !level) continue;

      const li = listEl.querySelector(`li[data-document-match][data-uuid="${uuid}"]`);
      const nameAnchor = li?.querySelector("a[data-name]");
      if (!nameAnchor) continue;

      const powerLevel = game.i18n.localize(`INVINCIBLE.Item.Power.FIELDS.level.${level}.label`);
      nameAnchor.textContent = `${powerLevel}${name}`;
    }
  }
}
