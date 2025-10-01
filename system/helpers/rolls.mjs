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
  });
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

  for (const target of game.canvas.tokens.controlled) {
    const changes = {};

    let protection = 0;
    if (target.actor?.bonuses?.armorProtection)
      protection = Math.max(...Object.values(target.actor.bonuses.armorProtection));
    const damage = Math.max(0, roll.attackDamage - protection);
    if (!damage)
      continue;

    const newHealth = target.actor.system.derived.health.value - damage;
    changes["system.derived.health.value"] = Math.max(0, newHealth);
    await target.actor.update(changes);

    await InvincibleChatMessage.sendToChat(target.actor, game.i18n.localize("INVINCIBLE.Chat.DamageInfo.DamageTaken"), `<p>${game.i18n.format("INVINCIBLE.Chat.DamageInfo.DamageInfo", { actor: target.actor.name, damage: damage })}</p>`, { shiftKey: true });

    if (newHealth >= 0)
      continue;

    //TODO: roll critical injury automatically?
  }
}

export async function applyStress(message, roll) {
  if (!roll.attributeTrauma)
    return;

  const actor = game.actors.get(message.speaker.actor);
  if (!actor)
    return;

  return actor.update({ "system.derived.resolve.value": actor.system.derived.resolve.value - roll.attributeTrauma });
}