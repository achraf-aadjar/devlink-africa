import PageShell from './PageShell'

/**
 * Enveloppe de route pour les écrans à grille dense : recherche, pays, projets,
 * tableau de bord, matchs. Voir `size="wide"` dans PageContainer.tsx.
 */
export default function WidePage() {
  return <PageShell size="wide" />
}
