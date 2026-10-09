import { describe, expect, it } from 'vitest'
import * as labels from '../lib/labels'
import { EN } from './en'
import { translate, translatePlural } from './translate'

/** Le code de l'application, hors tests, chargé en texte par Vite. */
const SOURCES = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!../test/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const LITERAL = String.raw`(['"])((?:\\.|(?!\1)[^\\])*)\1`

/** Textes littéraux passés à t('…'), msg('…') ou tn(n, '…', '…'). */
function translatableTexts(): Map<string, string> {
  const single = new RegExp(String.raw`\b(?:t|msg)\(\s*` + LITERAL, 'g')
  const plural = new RegExp(
    String.raw`\btn\(\s*[^,()]+(?:\([^()]*\))?,\s*` +
      LITERAL +
      String.raw`\s*,\s*` +
      LITERAL.replaceAll('\\1', '\\3'),
    'g',
  )
  const found = new Map<string, string>()
  const add = (raw: string, file: string) => {
    const text = raw.replace(/\\(['"\\])/g, '$1')
    if (!found.has(text)) found.set(text, file)
  }
  for (const [file, code] of Object.entries(SOURCES)) {
    for (const match of code.matchAll(single)) add(match[2], file)
    for (const match of code.matchAll(plural)) {
      add(match[2], file)
      add(match[4], file)
    }
  }
  return found
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
}

describe('traduction anglaise', () => {
  it('lit bien le code de l’application (sinon le test passerait à vide)', () => {
    const texts = translatableTexts()
    expect(Object.keys(SOURCES).length).toBeGreaterThan(50)
    expect(texts.has('Tableau de bord')).toBe(true)
    expect(texts.has('{n} preuve')).toBe(true)
    expect(texts.has('{n} preuves')).toBe(true)
  })

  it('traduit chaque texte de l’interface', () => {
    const missing = [...translatableTexts()]
      .filter(([text]) => !(text in EN))
      .map(([text, file]) => `${file} : ${text}`)

    expect(missing).toEqual([])
  })

  it('traduit chaque libellé des énumérations', () => {
    const values = Object.values(labels)
      .filter((value): value is Record<string, string> => typeof value === 'object')
      .flatMap((map) => Object.values(map))

    expect(values.filter((value) => !(value in EN))).toEqual([])
  })

  it('ne garde aucune traduction orpheline (texte retiré de l’interface)', () => {
    // Le dictionnaire lui-même est exclu : sinon chaque clé s'y trouverait.
    const code = Object.entries(SOURCES)
      .filter(([file]) => !file.endsWith('/en.ts'))
      .map(([, source]) => source)
      .join('\n')
    const quoted = (text: string) =>
      [`'${text.replace(/'/g, "\\'")}'`, `"${text}"`].some((form) => code.includes(form))

    expect(Object.keys(EN).filter((text) => !quoted(text))).toEqual([])
  })

  it('garde les mêmes variables dans la traduction', () => {
    const mismatched = Object.entries(EN).filter(
      ([french, english]) => placeholders(french).join() !== placeholders(english).join(),
    )

    expect(mismatched).toEqual([])
  })

  it('remplace les variables et retombe sur le français si une traduction manque', () => {
    expect(translate('fr', 'Bonjour {name}', { name: 'Ada' })).toBe('Bonjour Ada')
    expect(translate('en', 'Un texte jamais traduit')).toBe('Un texte jamais traduit')
  })

  it('distingue un même mot selon son contexte, sans jamais afficher le contexte', () => {
    expect(translate('fr', 'Pays|menu')).toBe('Pays')
    expect(translate('en', 'Pays|menu')).toBe('Countries')
    expect(translate('en', 'Pays')).toBe('Country')
    expect(translate('en', 'Texte inconnu|contexte')).toBe('Texte inconnu')
  })

  it('accorde selon la langue : 0 est singulier en français, pluriel en anglais', () => {
    const forms = ['{n} preuve', '{n} preuves'] as const
    expect(translatePlural('fr', 0, ...forms)).toBe('0 preuve')
    expect(translatePlural('fr', 2, ...forms)).toBe('2 preuves')
    expect(translatePlural('en', 0, ...forms)).toBe('0 proofs')
    expect(translatePlural('en', 1, ...forms)).toBe('1 proof')
  })
})
