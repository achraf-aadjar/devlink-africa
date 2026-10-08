import PageShell from './PageShell'

/**
 * Enveloppe de route : applique la largeur de lecture standard.
 *
 * Toutes les pages sauf l'accueil passent par ici ou par WidePage (voir
 * routes.tsx). L'accueil s'en passe pour poser une bannière pleine largeur.
 */
export default function StandardPage() {
  return <PageShell size="default" />
}
