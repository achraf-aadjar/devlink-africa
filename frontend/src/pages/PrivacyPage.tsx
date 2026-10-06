import { Link } from 'react-router-dom'
import { Card } from '../components/ui'

/**
 * Politique de confidentialité (DL-40).
 *
 * Exigée par la loi sénégalaise n° 2008-12 sur la protection des données
 * personnelles. Accessible sans connexion, et liée depuis l'inscription.
 */
export default function PrivacyPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Politique de confidentialité</h1>
        <p className="mt-1 text-sm text-ink-600">Dernière mise à jour : octobre 2026.</p>
      </header>

      <Card className="flex flex-col gap-6 text-sm leading-relaxed text-ink-700">
        <div>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Qui traite vos données</h2>
          <p>
            DevLink Africa est un projet réalisé par une équipe de trois développeurs dans le cadre
            du concours CADEV 2026. Le traitement est soumis à la loi sénégalaise n° 2008-12 du 25
            janvier 2008 sur la protection des données à caractère personnel.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Données collectées</h2>
          <p className="mb-2">
            Nous collectons le minimum nécessaire au fonctionnement de la mise en relation :
          </p>
          <ul className="ml-5 flex list-disc flex-col gap-1">
            <li>
              <strong>Votre adresse e-mail</strong> : elle sert uniquement à vous identifier lors de
              la connexion. Elle n'est <strong>jamais</strong> affichée aux autres utilisateurs.
            </li>
            <li>
              <strong>Votre mot de passe</strong> : il est haché avec l'algorithme Argon2. Nous ne
              pouvons pas le lire, même en consultant la base de données.
            </li>
            <li>
              <strong>Votre profil</strong> : nom, pays, présentation, disponibilités, domaines,
              adresse de votre photo. Ces informations sont publiques sur la plateforme, parce que
              c'est leur raison d'être : permettre aux autres de vous trouver.
            </li>
            <li>
              <strong>Vos compétences</strong>, vos projets, vos demandes d'échange et vos
              signalements.
            </li>
          </ul>
          <p className="mt-2">
            Nous ne collectons ni numéro de téléphone, ni adresse postale, ni donnée bancaire. Nous
            n'utilisons aucun traceur publicitaire.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Pourquoi</h2>
          <ul className="ml-5 flex list-disc flex-col gap-1">
            <li>vous permettre de vous connecter et de tenir votre profil à jour ;</li>
            <li>calculer vos correspondances avec d'autres développeurs (Dev Match) ;</li>
            <li>vous mettre en relation lorsque vous le demandez ;</li>
            <li>traiter les signalements et protéger la communauté.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Combien de temps</h2>
          <p>
            Vos données sont conservées tant que votre compte existe. Lorsque vous le supprimez,
            elles sont effacées, y compris vos compétences, vos projets et vos échanges.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Vos droits</h2>
          <p className="mb-2">
            Vous disposez d'un droit d'accès, de rectification, d'opposition et d'effacement. Vous
            pouvez les exercer directement depuis la plateforme :
          </p>
          <ul className="ml-5 flex list-disc flex-col gap-1">
            <li>
              <strong>Accès et rectification</strong> : la page{' '}
              <Link to="/profil" className="text-accent-700 underline">
                Mon profil
              </Link>{' '}
              permet de consulter et de modifier vos informations.
            </li>
            <li>
              <strong>Export</strong> : vous pouvez télécharger l'ensemble de vos données depuis
              votre profil.
            </li>
            <li>
              <strong>Effacement</strong> : la suppression de votre compte est définitive et
              immédiate, depuis votre profil.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Sécurité</h2>
          <p>
            Les échanges avec le site sont chiffrés (HTTPS). Les mots de passe sont hachés avec
            Argon2. Les tentatives de connexion sont limitées pour empêcher les attaques par force
            brute. Nous ne journalisons jamais de mot de passe, de jeton d'accès ni d'adresse e-mail
            en clair.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Profils de démonstration</h2>
          <p>
            Certains profils servent à illustrer le fonctionnement de la plateforme. Ils sont
            entièrement fictifs et portent la mention « Profil de démonstration ». Aucune personne
            réelle n'y est représentée.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Nous contacter</h2>
          <p>
            Pour toute question sur vos données, écrivez à l'équipe depuis l'adresse associée à
            votre compte. Nous répondons dans un délai de trente jours.
          </p>
        </div>
      </Card>
    </section>
  )
}
