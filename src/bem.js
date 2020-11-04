export const BEM = (block) => (variants, contexts, options) => {
  const template = require('lodash.template');
  let data = { block };
  let formatter = template(options.blockFormat);
  let base = formatter(data);

  base = (variants ? Object.entries(variants).reduce((target, [key, value]) => {
    if (!value) {
      return target;
    }

    data = { base, key, value };
    formatter = value === true ? template(options.variantFormatTrue) : template(options.variantFormat);
    target += formatter(data);

    return target;
  }, '') : base);

  base = (contexts ? Object.entries(contexts).reduce((target, [key, value]) => {
    if (!value) {
      return target;
    }

    data = { base, key, value };
    formatter = value === true ? template(options.contextFormatTrue) : template(options.contextFormat);
    target += formatter(data);

    return target;
  }, '') : base);

  return base;
};
