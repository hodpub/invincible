export function createListAndChoices(obj, name, constants, label, { plural = undefined } = {}) {
  plural ??= `${name}S`;
  obj[plural] = Object.keys(constants);
  obj[`${name}_CHOICES`] = Object.assign(
    ...Object.keys(constants).map(it => ({
      [it]: `${label}.${it}.label`
    }))
  );
}