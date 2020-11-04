export const BEM = (block) => (elems, mods, options) => {
  const template = require('lodash.template');
  let data = { block };
  let formatter = template(options.blockFormat);
  let base = formatter(data);

  base = (elems ? Object.entries(elems).reduce((target, [key, value]) => {
    if (!value) {
      return target;
    }

    data = { base, key, value };
    formatter = value === true ? template(options.elementFormatTrue) : template(options.elementFormat);
    target += formatter(data);

    return target;
  }, '') : base);

  base = (mods ? Object.entries(mods).reduce((target, [key, value]) => {
    if (!value) {
      return target;
    }

    data = { base, key, value };
    formatter = value === true ? template(options.modifierFormatTrue) : template(options.modifierFormat);
    target += formatter(data);

    return target;
  }, '') : base);

  return base;
};
