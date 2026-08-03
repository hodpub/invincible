import { INVINCIBLE } from "../config/_invincible.mjs";
import { MIGRATION_LIST } from "./_migrations.mjs";

export function registerMigrationSettings() {
  game.settings.register(INVINCIBLE.ID, "systemMigrationVersion", {
    config: false,
    scope: "world",
    type: String,
    default: ""
  });
}

export async function migrate() {
  if (!game.user.isGM)
    return;

  const currentVersion = game.settings.get(INVINCIBLE.ID, "systemMigrationVersion");
  console.log("Invincible Data CurrentVersion", currentVersion);

  let latestMigration = undefined;
  for (const key of Object.keys(MIGRATION_LIST)) {
    if (currentVersion && !foundry.utils.isNewerVersion(key, currentVersion))
      continue;

    ui.notifications.warn(`Migrating your data to version ${key}. Please, wait until it finishes.`);
    await MIGRATION_LIST[key]();
    ui.notifications.info(`Data migrated to version ${key}.`);
    latestMigration = key;
  }
  if (latestMigration)
    game.settings.set(INVINCIBLE.ID, "systemMigrationVersion", latestMigration);
}
