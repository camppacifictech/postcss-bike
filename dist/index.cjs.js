'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var postcss = _interopDefault(require('postcss'));

const BEM = (block) => (variants, contexts, options) => {
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

const DEFAULT_OPTIONS = {
  component: 'component',
  variant: 'variant',
  context: 'context',
  variantRegExp: /([\w\-]+)(?:\[([\w\-]+)\])?/,
  contextRegExp: /([\w\-]+)(?:\[([\w\-]+)\])?/,
  blockFormat: '.${block}',
  variantFormat: '.${base}__${key}_${value}',
  variantFormatTrue: '.${base}__${key}',
  contextFormat: '${base}_${key}_${value}',
  contextFormatTrue: '${base}_${key}'
};

var index = postcss.plugin('postcss-bike', (options = DEFAULT_OPTIONS) => {
  options = Object.assign({}, DEFAULT_OPTIONS, options);

  return (root) => {
    const process = (node) => {
      if (node.nodes.length === 0) {
        return node;
      }

      if (node.name === options.component) {
        node.metadata = { bem: BEM(node.params), type: options.component };
      }

      let selector = '';

      switch (node.metadata.type) {
        case options.component:
          selector = node.metadata.bem(null, null, options);
          break;
        case options.context:
          let [, contextName, contextVal = true] = node.metadata.name.match(options.contextRegExp);

          node.metadata.contexts = { [contextName]: contextVal };
          if (node.parent.metadata.type === options.context) {
            node.metadata.contexts = { ...node.parent.metadata.contexts, ...node.metadata.contexts };
          }

          selector = node.metadata.bem(node.parent.metadata.variants, node.metadata.contexts, options);
          break;
        case options.variant:
          let [, variantName, variantVal = true] = node.metadata.name.match(options.variantRegExp);

          node.metadata.variants = { [variantName]: variantVal };
          if (node.parent.metadata.type === options.variant) {
            node.metadata.variants = { ...node.parent.metadata.variants, ...node.metadata.variants };
          }

          selector = node.metadata.bem(node.metadata.variants, node.parent.metadata.contexts, options);
          break;
      }

      const rule = postcss.rule({
        raws: { semicolon: true },
        selector: selector,
        source: node.source,
        metadata: node.metadata
      });

      node.walkDecls(decl => {
        const declClone = postcss.decl({
          raws: { before: '\n  ', between: ': ' },
          source: decl.source,
          prop: decl.prop,
          value: decl.value
        });

        decl.replaceWith(declClone);
      });

      rule.append(node.nodes);
      node.remove();
      root.append(rule);

      rule.walkAtRules(child => {
        if (![options.variant, options.context].includes(child.name)) {
          return;
        }

        child.metadata = {
          type: child.name,
          name: child.params,
          bem: rule.metadata.bem,
        };

        return process(child);
      });
    };

    root.walkAtRules(options.component, process);
  };
});

module.exports = index;
//# sourceMappingURL=index.cjs.js.map
