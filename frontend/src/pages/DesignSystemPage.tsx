import Icon from '../components/icons/Icon'
import { LogoMark } from '../components/icons/Logo'
import { ICON_NAMES } from '../components/icons/paths'
import { DotsPattern, RingsPattern, WeavePattern } from '../components/icons/Patterns'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Skeleton,
} from '../components/ui'

/** Page de démonstration du design system (critère d'acceptation de DL-07). */
export default function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="page-title">Design system</h1>
        <p className="mt-1 text-sm text-ink-600">
          Les composants réutilisables de l'interface : la feuille de match. Tableau clair par
          défaut, ardoise en sombre, un bleu d'action, un orange pour la demande, Fira Sans.
        </p>
      </header>

      <section aria-labelledby="marque" className="flex flex-col gap-3">
        <h2 id="marque" className="sheet-title">
          La marque
        </h2>
        <p className="text-sm text-ink-600">
          Deux anneaux qui se recouvrent : la complémentarité réciproque, le cœur du produit. Leur
          intersection est ce que les deux personnes produisent ensemble.
        </p>
        <div className="flex flex-wrap items-end gap-8">
          {[64, 44, 32, 20, 16].map((size) => (
            <div key={size} className="text-center">
              <LogoMark size={size} />
              <p className="mt-2 text-xs text-ink-500">{size} px</p>
            </div>
          ))}
          <div className="text-center">
            <div className="rounded-lg bg-accent-200 p-3">
              <LogoMark size={44} variant="mono" className="text-accent-800" />
            </div>
            <p className="mt-2 text-xs text-ink-500">sur fond coloré</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="icones" className="flex flex-col gap-3">
        <h2 id="icones" className="sheet-title">
          Icônes
        </h2>
        <p className="text-sm text-ink-600">
          {ICON_NAMES.length} icônes dessinées sur la même grille : trait de 1,75 unité, extrémités
          arrondies, marge optique de 2 unités. Elles suivent la couleur du texte qui les entoure.
        </p>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {ICON_NAMES.map((name) => (
            <li key={name} className="flex flex-col items-center gap-2 surface p-4">
              <Icon name={name} size={24} />
              <code className="text-center text-[0.65rem] leading-tight text-ink-500">{name}</code>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-accent-700">
            <Icon name="match" size={18} /> héritent de la couleur
          </span>
          <span className="flex items-center gap-2 text-sm text-danger">
            <Icon name="warning" size={18} /> sans réglage
          </span>
          <span className="flex items-center gap-2 text-sm text-success">
            <Icon name="check" size={18} /> ni duplication
          </span>
        </div>
      </section>

      <section aria-labelledby="motifs" className="flex flex-col gap-3">
        <h2 id="motifs" className="sheet-title">
          Motifs d'arrière-plan
        </h2>
        <p className="text-sm text-ink-600">
          Un fond ne doit jamais se remarquer : s'il attire l'œil, il nuit au texte posé dessus.
          D'où ces opacités très basses. Le monde visuel est le tableau tactique ; ces motifs
          restent en réserve.
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <RingsPattern className="surface p-6">
            <p className="text-sm font-medium text-ink-800">Anneaux</p>
            <p className="text-xs text-ink-600">Les deux anneaux du logo</p>
          </RingsPattern>
          <WeavePattern className="surface p-6">
            <p className="text-sm font-medium text-ink-800">Tissage</p>
            <p className="text-xs text-ink-600">Trame tissée</p>
          </WeavePattern>
          <DotsPattern className="surface p-6">
            <p className="text-sm font-medium text-ink-800">Points</p>
            <p className="text-xs text-ink-600">Trame discrète</p>
          </DotsPattern>
        </div>
      </section>

      <section aria-labelledby="couleurs" className="flex flex-col gap-3">
        <h2 id="couleurs" className="sheet-title">
          Couleurs
        </h2>
        <div className="flex flex-wrap gap-2">
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((shade) => (
            <div key={shade} className="text-center">
              <div className={`h-12 w-12 rounded ring-1 ring-veil/15 bg-accent-${shade}`} />
              <span className="text-xs text-ink-500">{shade}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((shade) => (
            <div key={shade} className="text-center">
              <div className={`h-12 w-12 rounded ring-1 ring-veil/15 bg-ink-${shade}`} />
              <span className="text-xs text-ink-500">{shade}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-ink-600">
          Les deux couleurs d'aimant : <code>brand</code> (l'action et l'offre, « Je sais faire »)
          et <code>demand</code> (la demande, « Je veux apprendre »). <code>bar</code> est le noir
          du tableau d'affichage : en-tête et plaques de score.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ['brand', 'bg-brand'],
            ['brand-hover', 'bg-brand-hover'],
            ['demand', 'bg-demand'],
            ['demand-fill', 'bg-demand-fill'],
            ['bar', 'bg-bar'],
            ['danger', 'bg-danger'],
            ['success', 'bg-success'],
            ['warning', 'bg-warning'],
          ].map(([name, cls]) => (
            <div key={name} className="text-center">
              <div className={`h-12 w-12 rounded ring-1 ring-veil/15 ${cls}`} />
              <span className="text-xs text-ink-500">{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="boutons" className="flex flex-col gap-3">
        <h2 id="boutons" className="sheet-title">
          Boutons
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Principal</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="ghost">Discret</Button>
          <Button variant="danger">Supprimer</Button>
          <Button loading>Chargement</Button>
          <Button disabled>Désactivé</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Petit</Button>
          <Button size="md">Moyen</Button>
          <Button size="lg">Grand</Button>
        </div>
      </section>

      <section aria-labelledby="champs" className="flex flex-col gap-3">
        <h2 id="champs" className="sheet-title">
          Champs
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field label="Adresse e-mail" placeholder="vous@example.org" />
          <Field label="Mot de passe" type="password" required hint="10 caractères au minimum." />
          <Field label="Pays" error="Ce champ est obligatoire." />
          <Field label="Désactivé" disabled value="Non modifiable" readOnly />
        </div>
      </section>

      <section aria-labelledby="badges" className="flex flex-col gap-3">
        <h2 id="badges" className="sheet-title">
          Badges de compétence
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="offered">Je sais : Python</Badge>
          <Badge tone="wanted">Je veux apprendre : Docker</Badge>
          <Badge tone="accent">Avancé</Badge>
          <Badge tone="neutral">Débutant</Badge>
          <Badge tone="demo">Profil de démonstration</Badge>
          <Badge tone="success">Accepté</Badge>
          <Badge tone="warning">En attente</Badge>
        </div>
      </section>

      <section aria-labelledby="etats" className="flex flex-col gap-4">
        <h2 id="etats" className="sheet-title">
          Les quatre états d'un écran
        </h2>
        <div>
          <p className="mb-2 text-sm font-medium text-ink-600">Chargement</p>
          <LoadingState rows={2} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-ink-600">Vide</p>
          <EmptyState
            title="Aucun match pour le moment"
            description="Ajoutez les compétences que vous savez et celles que vous voulez apprendre : Dev Match vous proposera des profils complémentaires."
            action={<Button size="sm">Ajouter mes compétences</Button>}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-ink-600">Erreur</p>
          <ErrorState onRetry={() => undefined} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-ink-600">Succès</p>
          <Card>
            <h3 className="font-semibold text-ink-900">Kofi Mensah</h3>
            <p className="mt-1 text-sm text-ink-600">Backend Python · Ghana</p>
            <div className="mt-3 flex gap-2">
              <Badge tone="offered">Python</Badge>
              <Badge tone="wanted">TypeScript</Badge>
            </div>
          </Card>
        </div>
      </section>

      <section aria-labelledby="squelette" className="flex flex-col gap-3">
        <h2 id="squelette" className="sheet-title">
          Squelettes
        </h2>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>
    </div>
  )
}
