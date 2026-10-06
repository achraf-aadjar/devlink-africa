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
        <h1 className="text-2xl font-bold text-ink-900">Design system</h1>
        <p className="mt-1 text-sm text-ink-600">
          Les composants réutilisables de l'interface. Un seul accent (terre cuite), des gris
          chauds, des polices système.
        </p>
      </header>

      <section aria-labelledby="couleurs" className="flex flex-col gap-3">
        <h2 id="couleurs" className="text-lg font-semibold text-ink-800">
          Couleurs
        </h2>
        <div className="flex flex-wrap gap-2">
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((shade) => (
            <div key={shade} className="text-center">
              <div className={`h-12 w-12 rounded border border-ink-200 bg-accent-${shade}`} />
              <span className="text-xs text-ink-500">{shade}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((shade) => (
            <div key={shade} className="text-center">
              <div className={`h-12 w-12 rounded border border-ink-200 bg-ink-${shade}`} />
              <span className="text-xs text-ink-500">{shade}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="boutons" className="flex flex-col gap-3">
        <h2 id="boutons" className="text-lg font-semibold text-ink-800">
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
        <h2 id="champs" className="text-lg font-semibold text-ink-800">
          Champs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse e-mail" placeholder="vous@example.org" />
          <Field label="Mot de passe" type="password" required hint="10 caractères au minimum." />
          <Field label="Pays" error="Ce champ est obligatoire." />
          <Field label="Désactivé" disabled value="Non modifiable" readOnly />
        </div>
      </section>

      <section aria-labelledby="badges" className="flex flex-col gap-3">
        <h2 id="badges" className="text-lg font-semibold text-ink-800">
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
        <h2 id="etats" className="text-lg font-semibold text-ink-800">
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
        <h2 id="squelette" className="text-lg font-semibold text-ink-800">
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
