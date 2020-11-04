import postcss from 'postcss';
import { BEM } from './bem';

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

export default postcss.plugin('postcss-bike', (options = DEFAULT_OPTIONS) => {
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
})
