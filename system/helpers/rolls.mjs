import InvincibleStuntsDialog from "../applications/dialog/stunts.mjs";
import { InvincibleChatMessage } from "../documents/chat-message.mjs";

const ID = "invincible";
export function registerDice3D(dice3d) {
  dice3d.addColorset(
    {
      name: 'Invincible Base',
      description: 'Invincible Base',
      category: 'Colors',
      foreground: ['#c1af79'],
      background: ['#0096cb'],
      outline: '#c1af79',
      texture: 'none',
    },
    'preferred',
  );

  // dice3d.addColorset(
  //   {
  //     name: 'CTGDGear',
  //     description: 'CTGDGear',
  //     category: 'Colors',
  //     foreground: ['#c1af79'],
  //     background: ['#000000'],
  //     outline: '#000000',
  //     texture: 'none',
  //   },
  //   'preferred',
  // );

  dice3d.addSystem({ id: ID, name: 'Invincible' }, 'preferred');
  dice3d.addDicePreset({
    type: 'db',
    labels: [
      `systems/${ID}/assets/dice/base-1.webp`,
      `systems/${ID}/assets/dice/base-2.webp`,
      `systems/${ID}/assets/dice/base-3.webp`,
      `systems/${ID}/assets/dice/base-4.webp`,
      `systems/${ID}/assets/dice/base-5.webp`,
      `systems/${ID}/assets/dice/base-6.webp`,
    ],
    colorset: 'Invincible Base',
    system: ID,
  }, "d6");
  // dice3d.addDicePreset({
  //   type: 'dg',
  //   labels: [
  //     `systems/${ID}/assets/dice/gear-1.webp`,
  //     `systems/${ID}/assets/dice/gear-2.webp`,
  //     `systems/${ID}/assets/dice/gear-3.webp`,
  //     `systems/${ID}/assets/dice/gear-4.webp`,
  //     `systems/${ID}/assets/dice/gear-5.webp`,
  //     `systems/${ID}/assets/dice/gear-6.webp`,
  //   ],
  //   colorset: 'CTGDGear',
  //   system: ID,
  // });
}

export async function applyStunts(message) {
  const roll = message.rolls[0];
  if (!roll || !roll.stunts)
    return;

  return new InvincibleStuntsDialog(message, 0).wait();
}

export async function applyTargetDamage(message, roll) {
  if (!game.user.isGM) {
    ui.notifications.error("You are not a GM!");
    return;
  }

  if (!roll.attackDamage)
    return;

  const criticalInjuries = await fromUuid("Compendium.invincible.rolltables.RollTable.lRIHdMV6UBdDaeae");

  let condition = null;

  if (roll.options.conditionToApply)
    condition = await fromUuid(roll.options.conditionToApply);

  for (const target of game.canvas.tokens.controlled) {
    const changes = {};

    let protection = 0;
    if (target.actor?.bonuses?.armorProtection && !roll.options.bypassArmor)
      protection = Math.max(...Object.values(target.actor.bonuses.armorProtection));
    const damage = Math.max(0, roll.attackDamage - protection);
    if (!damage)
      continue;

    if (roll.options.conditionToApply)
      target.actor.createEmbeddedDocuments(condition.documentName, [condition]);

    if (!roll.options.actualDamage)
      continue;

    const newHealth = target.actor.system.derived.health.value - damage;
    changes["system.derived.health.value"] = Math.max(0, newHealth);
    await target.actor.update(changes);

    let content = `<p>${game.i18n.format("INVINCIBLE.Chat.DamageInfo.DamageInfo", { actor: target.actor.name, damage: damage })}</p>`
    if (newHealth < 0) {
      let ciRoll = await Roll.create(`1d6 + ${newHealth * -1}`).roll();
      let ciDraw = await criticalInjuries.draw({ roll: ciRoll, displayChat: false });
      let ciUuid = ciDraw.results[0].documentUuid;
      let ciItem = await fromUuid(ciUuid);

      const ciExists = target.actor.items.get(ciItem.id);
      if (ciExists) {
        ciRoll = await Roll.create(`${ciRoll.total + 1}`).roll();
        ciDraw = await criticalInjuries.draw({ roll: ciRoll, displayChat: false });
        ciUuid = ciDraw.results[0].documentUuid;
        ciItem = await fromUuid(ciUuid);
      }

      content += `<p>${game.i18n.format("INVINCIBLE.Chat.DamageInfo.CriticalInjury", { ciName: ciItem.name })}</p>`;

      target.actor.createEmbeddedDocuments(ciItem.documentName, [ciItem]);
    }

    await InvincibleChatMessage.sendToChat(target.actor, game.i18n.localize("INVINCIBLE.Chat.DamageInfo.DamageTaken"), content, { shiftKey: true });
  }
}

export async function applyStress(message, roll) {
  if (!roll.options.stressCost || roll.pushable)
    return;

  const actor = message.speakerActor;
  if (!actor)
    return;

  return actor.update({ "system.derived.resolve.value": actor.system.derived.resolve.value - roll.options.stressCost });
}