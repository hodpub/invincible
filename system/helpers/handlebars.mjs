export default function registerHandlebarsHelpers() {
  Handlebars.registerHelper({
    bar,
    add,
    addActiveSign
  });
}

export function bar(value, max) {
  const percentage = Math.min((value / max) * 100, 100);
  return new Handlebars.SafeString(`
      <div class="inner-bar" style="background: linear-gradient(to right, #ffe72a ${percentage}%, #fff ${percentage + 1}%)"></div>
  `);
}

export function add(value, increment) {
  return value + increment;
}


export function addActiveSign(isActive) {
  if (isActive == null)
    return "";
  const cssClass = isActive ? "fa fa-circle-check" : "fa-regular fa-circle";
  return new Handlebars.SafeString(` <i class="${cssClass}"></i>`);
}