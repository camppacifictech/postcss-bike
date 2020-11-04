import postcss from 'postcss';
import { BEM } from './bem';

const DEFAULT_OPTIONS = {
  component: 'component',
  element: 'elem',
  modifier: 'mod',
  elementRegExp: /([\w\-]+)(?:\[([\w\-]+)\])?/,
  modifierRegExp: /([\w\-]+)(?:\[([\w\-]+)\])?/,
  blockFormat: '.${block}',
  elementFormat: '.${base}__${key}_${value}',
  elementFormatTrue: '.${base}__${key}',
  modifierFormat: '${base}_${key}_${value}',
  modifierFormatTrue: '${base}_${key}'
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
        case options.modifier:
          let [, modName, modVal = true] = node.metadata.name.match(options.modifierRegExp);

          node.metadata.mods = { [modName]: modVal };
          if (node.parent.metadata.type === options.modifier) {
            node.metadata.mods = { ...node.parent.metadata.mods, ...node.metadata.mods };
          }

          selector = node.metadata.bem(node.parent.metadata.elems, node.metadata.mods, options);
          break;
        case options.element:
          let [, elemName, elemVal = true] = node.metadata.name.match(options.elementRegExp);

          node.metadata.elems = { [elemName]: elemVal };
          if (node.parent.metadata.type === options.element) {
            node.metadata.elems = { ...node.parent.metadata.elems, ...node.metadata.elems };
          }

          selector = node.metadata.bem(node.metadata.elems, node.parent.metadata.mods, options);
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
        if (![options.element, options.modifier].includes(child.name)) {
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
