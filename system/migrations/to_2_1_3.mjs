export async function migrateTo_2_1_3() {
  console.log("=> Migration 2.1.3 Starting");
  console.log("=> Migration 2.1.3: Adjust `bonus.armorProtection` AE");

  for (const actor of game.actors) {
    for (const effect of actor.appliedEffects) {
      const changes = effect.changes;
      let changed = false;
      for (const change of changes) {
        if (change.key != "bonuses.armorProtection")
          continue;
        changed = true;
        change.key = "bonus.armorProtection";
      }
      if (!changed)
        continue;

      await effect.update({ "system.changes": changes });

      console.log(`=> Migration 2.1.3: Actor: ${actor.name} | Item: ${effect.parent.name} | AE: ${effect.name}`);
    }
  }


  console.log("=> Migration 2.1.3 Finished");
}
