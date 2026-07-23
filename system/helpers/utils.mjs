export function unflatten(data) {
  var result = {}
  for (var i in data) {
    var keys = i.split('.')
    keys.reduce(function (r, e, j) {
      return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 == j ? data[i] : {}) : [])
    }, result)
  }
  return result;
}

export function getStuntText(item, data) {
  return game.i18n.format(`INVINCIBLE.Stunts.${item}.stunt`, data);
}

export function signedNumber(n) { return (n > 0) ? `+${n}` : n; }

const TextEditor = foundry.applications.ux.TextEditor.implementation;
export async function enrich(obj, key) {
  const value = foundry.utils.getProperty(obj, key);
  return await TextEditor.enrichHTML(
    value,
    {
      // Whether to show secret blocks in the finished html
      secrets: obj.isOwner,
      // Data to fill in for inline rolls
      rollData: obj.getRollData(),
      // Relative UUID resolution
      relativeTo: obj,
    }
  );
}

export function defaultSort(a, b) {
  return (a.sort || 0) - (b.sort || 0) || a.name.localeCompare(b.name)
}