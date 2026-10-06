/**
 * Règles d'accessibilité maison.
 *
 * Pourquoi maison : `eslint-plugin-jsx-a11y` tire `axe-core`, sous licence
 * MPL-2.0, interdite par le règlement du concours (article 6). Nous ne pouvons
 * donc pas l'utiliser, même en dépendance de développement. Ces règles couvrent
 * les fautes que nous risquons réellement dans ce projet.
 *
 * Voir docs/DECISIONS.md.
 */

/** Récupère la valeur littérale d'un attribut JSX, ou undefined. */
function literalValue(attribute) {
  const value = attribute.value
  if (value === null) return true // <input disabled />
  if (value.type === 'Literal') return value.value
  if (value.type === 'JSXExpressionContainer' && value.expression.type === 'Literal') {
    return value.expression.value
  }
  return undefined
}

function attributeNamed(node, name) {
  return node.attributes.find(
    (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === name,
  )
}

function elementName(node) {
  return node.name.type === 'JSXIdentifier' ? node.name.name : null
}

/** <img> doit porter un alt (éventuellement vide pour une image décorative). */
const imgRequiresAlt = {
  meta: {
    type: 'problem',
    docs: { description: 'Une image doit porter un attribut alt.' },
    schema: [],
    messages: {
      missing: 'Ajoutez un attribut alt (alt="" si l\'image est décorative).',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (elementName(node) !== 'img') return
        if (!attributeNamed(node, 'alt')) context.report({ node, messageId: 'missing' })
      },
    }
  },
}

/** <a> doit avoir un href : sinon ce n'est pas un lien, c'est un bouton. */
const anchorRequiresHref = {
  meta: {
    type: 'problem',
    docs: { description: 'Un lien doit avoir une destination.' },
    schema: [],
    messages: {
      missing: "Un <a> sans href n'est pas focusable : utilisez <button> ou <Link>.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (elementName(node) !== 'a') return
        const href = attributeNamed(node, 'href')
        if (!href || literalValue(href) === '' || literalValue(href) === '#') {
          context.report({ node, messageId: 'missing' })
        }
      },
    }
  },
}

/** Un lien ouvert dans un nouvel onglet doit porter rel="noopener" (critère de DL-35). */
const targetBlankRequiresNoopener = {
  meta: {
    type: 'problem',
    docs: { description: 'target="_blank" exige rel="noopener".' },
    schema: [],
    messages: {
      missing: 'Ajoutez rel="noopener noreferrer" à un lien ouvert dans un nouvel onglet.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (elementName(node) !== 'a') return
        const target = attributeNamed(node, 'target')
        if (!target || literalValue(target) !== '_blank') return

        const rel = attributeNamed(node, 'rel')
        const value = rel ? literalValue(rel) : undefined
        if (typeof value !== 'string' || !value.includes('noopener')) {
          context.report({ node, messageId: 'missing' })
        }
      },
    }
  },
}

/** Un bouton doit être explicitement typé : le défaut "submit" surprend hors formulaire. */
const buttonRequiresType = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Un <button> doit déclarer son type.' },
    schema: [],
    messages: {
      missing: 'Précisez type="button" ou type="submit".',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (elementName(node) !== 'button') return
        if (!attributeNamed(node, 'type')) context.report({ node, messageId: 'missing' })
      },
    }
  },
}

/**
 * Un contrôle de formulaire doit être nommé : par un <label for>, un aria-label
 * ou un aria-labelledby. On n'exige rien quand le composant est enveloppé
 * (notre composant Field s'en charge lui-même).
 */
const controlRequiresLabel = {
  meta: {
    type: 'problem',
    docs: { description: 'Un champ doit avoir un nom accessible.' },
    schema: [],
    messages: {
      missing:
        'Ce champ n\'a pas de nom accessible : utilisez <Field>, un aria-label, ou un <label for>.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = elementName(node)
        if (name !== 'input' && name !== 'select' && name !== 'textarea') return

        const type = attributeNamed(node, 'type')
        // Un bouton ou un champ caché n'a pas besoin d'étiquette.
        if (['hidden', 'submit', 'reset', 'button'].includes(literalValue(type) ?? '')) return

        const named =
          attributeNamed(node, 'id') ||
          attributeNamed(node, 'aria-label') ||
          attributeNamed(node, 'aria-labelledby')

        // Un champ dans un <label> parent est nommé par ce label.
        let parent = node.parent?.parent
        while (parent) {
          if (parent.type === 'JSXElement' && elementName(parent.openingElement) === 'label') return
          parent = parent.parent
        }

        if (!named) context.report({ node, messageId: 'missing' })
      },
    }
  },
}

/** Un gestionnaire de clic sur un élément non interactif doit être accessible au clavier. */
const clickableNeedsKeyboard = {
  meta: {
    type: 'problem',
    docs: { description: 'Un élément cliquable doit être utilisable au clavier.' },
    schema: [],
    messages: {
      missing:
        'onClick sur un élément non interactif : utilisez <button>, ou ajoutez role, tabIndex et onKeyDown.',
    },
  },
  create(context) {
    const INTERACTIVE = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary', 'details'])
    return {
      JSXOpeningElement(node) {
        const name = elementName(node)
        // Les composants React (majuscule) gèrent leur propre accessibilité.
        if (!name || /^[A-Z]/.test(name) || INTERACTIVE.has(name)) return
        if (!attributeNamed(node, 'onClick')) return

        const hasRole = attributeNamed(node, 'role')
        const hasTabIndex = attributeNamed(node, 'tabIndex')
        const hasKeyHandler =
          attributeNamed(node, 'onKeyDown') ||
          attributeNamed(node, 'onKeyUp') ||
          attributeNamed(node, 'onKeyPress')

        if (!hasRole || !hasTabIndex || !hasKeyHandler) {
          context.report({ node, messageId: 'missing' })
        }
      },
    }
  },
}

export default {
  rules: {
    'img-requires-alt': imgRequiresAlt,
    'anchor-requires-href': anchorRequiresHref,
    'target-blank-requires-noopener': targetBlankRequiresNoopener,
    'button-requires-type': buttonRequiresType,
    'control-requires-label': controlRequiresLabel,
    'clickable-needs-keyboard': clickableNeedsKeyboard,
  },
}
