import { Link } from 'react-router-dom'
import { Card } from '../components/ui'
import { useI18n } from '../i18n/useI18n'

/**
 * Politique de confidentialité (DL-40).
 *
 * Exigée par la loi sénégalaise n° 2008-12 sur la protection des données
 * personnelles. Accessible sans connexion, et liée depuis l'inscription.
 *
 * Texte juridique : il est rédigé d'un bloc dans chaque langue (`PrivacyFr`,
 * `PrivacyEn`) plutôt que découpé en dizaines de petites traductions. Toute
 * modification de l'un doit être reportée dans l'autre.
 */
export default function PrivacyPage() {
  const { t, lang } = useI18n()
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">
          {t('Politique de confidentialité')}
        </h1>
        <p className="mt-1 text-sm text-ink-600">{t('Dernière mise à jour : octobre 2026.')}</p>
      </header>

      <Card className="flex flex-col gap-6 text-sm leading-relaxed text-ink-700">
        {lang === 'en' ? <PrivacyEn /> : <PrivacyFr />}
      </Card>
    </section>
  )
}

const H2 = 'mb-2 text-base font-semibold text-ink-900'
const LIST = 'ml-5 flex list-disc flex-col gap-1'

function PrivacyEn() {
  return (
    <>
      <div>
        <h2 className={H2}>Who processes your data</h2>
        <p>
          DevLink Africa is a project built by a team of three developers for the CADEV 2026
          competition. The processing of your data is governed by Senegalese Law No. 2008-12 of
          January 25, 2008 on the protection of personal data.
        </p>
      </div>

      <div>
        <h2 className={H2}>Data we collect</h2>
        <p className="mb-2">We only collect what is needed to connect you with other developers:</p>
        <ul className={LIST}>
          <li>
            <strong>Your email address</strong>: used only to identify you when you sign in. It is{' '}
            <strong>never</strong> shown to other users.
          </li>
          <li>
            <strong>Your password</strong>: hashed with the Argon2 algorithm. We cannot read it, not
            even by looking at the database.
          </li>
          <li>
            <strong>Your profile</strong>: name, country, bio, availability, domains, and the URL of
            your photo. This information is public on the platform, because that is its whole
            purpose: helping others find you.
          </li>
          <li>
            <strong>Your contact method</strong>, if you choose to provide one (an email address or
            a link to GitHub, LinkedIn…). It is <strong>not public</strong>: only the people you
            have an accepted exchange with can see it. You can remove it at any time from My
            profile.
          </li>
          <li>
            <strong>Your skills</strong>, your projects, your exchange requests and your reports.
          </li>
          <li>
            <strong>Your endorsements</strong>: when you endorse a partner’s skill after working
            together, your name, your country and your comment appear on their public profile. You
            can withdraw an endorsement at any time.
          </li>
        </ul>
        <p className="mt-2">
          We do not collect phone numbers, postal addresses or banking details. We do not use any
          advertising trackers. Your browser only keeps your session and your language choice (local
          storage).
        </p>
      </div>

      <div>
        <h2 className={H2}>Why we use it</h2>
        <ul className={LIST}>
          <li>to let you sign in and keep your profile up to date;</li>
          <li>to compute your matches with other developers (Dev Match);</li>
          <li>to put you in touch with other developers when you ask;</li>
          <li>to handle reports and protect the community.</li>
        </ul>
      </div>

      <div>
        <h2 className={H2}>How long we keep it</h2>
        <p>
          Your data is kept for as long as your account exists. When you delete your account, your
          data is erased, including your skills, your projects and your exchanges.
        </p>
      </div>

      <div>
        <h2 className={H2}>Your rights</h2>
        <p className="mb-2">
          You have the right to access, rectify, object to and erase your data. You can exercise
          these rights directly on the platform:
        </p>
        <ul className={LIST}>
          <li>
            <strong>Access and rectification</strong>: the{' '}
            <Link to="/profil" className="text-accent-700 underline">
              My profile
            </Link>{' '}
            page lets you view and edit your information.
          </li>
          <li>
            <strong>Export</strong>: you can download all of your data from your profile.
          </li>
          <li>
            <strong>Erasure</strong>: deleting your account from your profile is permanent and takes
            effect immediately.
          </li>
        </ul>
      </div>

      <div>
        <h2 className={H2}>Security</h2>
        <p>
          All traffic to and from the site is encrypted (HTTPS). Passwords are hashed with Argon2.
          Sign-in attempts are rate-limited to prevent brute-force attacks. We never log passwords,
          access tokens or email addresses in plain text.
        </p>
      </div>

      <div>
        <h2 className={H2}>Demo profiles</h2>
        <p>
          Some profiles are there to show how the platform works. They are entirely fictional and
          are labeled “Demo profile”. No real person is depicted in them.
        </p>
      </div>

      <div>
        <h2 className={H2}>Contact us</h2>
        <p>
          For any question about your data, write to the team from the email address linked to your
          account. We reply within thirty days.
        </p>
      </div>
    </>
  )
}

function PrivacyFr() {
  return (
    <>
      <div>
        <h2 className={H2}>Qui traite vos données</h2>
        <p>
          DevLink Africa est un projet réalisé par une équipe de trois développeurs dans le cadre du
          concours CADEV 2026. Le traitement est soumis à la loi sénégalaise n° 2008-12 du 25
          janvier 2008 sur la protection des données à caractère personnel.
        </p>
      </div>

      <div>
        <h2 className={H2}>Données collectées</h2>
        <p className="mb-2">
          Nous collectons le minimum nécessaire au fonctionnement de la mise en relation :
        </p>
        <ul className={LIST}>
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
            <strong>Votre moyen de contact</strong>, si vous choisissez d'en indiquer un (adresse
            e-mail ou lien vers GitHub, LinkedIn…). Il n'est <strong>pas public</strong> : seule la
            personne avec qui vous avez un échange accepté le voit. Vous pouvez l'effacer à tout
            moment depuis Mon profil.
          </li>
          <li>
            <strong>Vos compétences</strong>, vos projets, vos demandes d'échange et vos
            signalements.
          </li>
          <li>
            <strong>Vos validations</strong> : quand vous validez une compétence d'un partenaire
            après avoir travaillé ensemble, votre nom, votre pays et votre commentaire apparaissent
            sur son profil public. Vous pouvez retirer une validation à tout moment.
          </li>
        </ul>
        <p className="mt-2">
          Nous ne collectons ni numéro de téléphone, ni adresse postale, ni donnée bancaire. Nous
          n'utilisons aucun traceur publicitaire. Votre navigateur garde seulement votre session et
          votre choix de langue (stockage local).
        </p>
      </div>

      <div>
        <h2 className={H2}>Pourquoi</h2>
        <ul className={LIST}>
          <li>vous permettre de vous connecter et de tenir votre profil à jour ;</li>
          <li>calculer vos correspondances avec d'autres développeurs (Dev Match) ;</li>
          <li>vous mettre en relation lorsque vous le demandez ;</li>
          <li>traiter les signalements et protéger la communauté.</li>
        </ul>
      </div>

      <div>
        <h2 className={H2}>Combien de temps</h2>
        <p>
          Vos données sont conservées tant que votre compte existe. Lorsque vous le supprimez, elles
          sont effacées, y compris vos compétences, vos projets et vos échanges.
        </p>
      </div>

      <div>
        <h2 className={H2}>Vos droits</h2>
        <p className="mb-2">
          Vous disposez d'un droit d'accès, de rectification, d'opposition et d'effacement. Vous
          pouvez les exercer directement depuis la plateforme :
        </p>
        <ul className={LIST}>
          <li>
            <strong>Accès et rectification</strong> : la page{' '}
            <Link to="/profil" className="text-accent-700 underline">
              Mon profil
            </Link>{' '}
            permet de consulter et de modifier vos informations.
          </li>
          <li>
            <strong>Export</strong> : vous pouvez télécharger l'ensemble de vos données depuis votre
            profil.
          </li>
          <li>
            <strong>Effacement</strong> : la suppression de votre compte est définitive et
            immédiate, depuis votre profil.
          </li>
        </ul>
      </div>

      <div>
        <h2 className={H2}>Sécurité</h2>
        <p>
          Les échanges avec le site sont chiffrés (HTTPS). Les mots de passe sont hachés avec
          Argon2. Les tentatives de connexion sont limitées pour empêcher les attaques par force
          brute. Nous ne journalisons jamais de mot de passe, de jeton d'accès ni d'adresse e-mail
          en clair.
        </p>
      </div>

      <div>
        <h2 className={H2}>Profils de démonstration</h2>
        <p>
          Certains profils servent à illustrer le fonctionnement de la plateforme. Ils sont
          entièrement fictifs et portent la mention « Profil de démonstration ». Aucune personne
          réelle n'y est représentée.
        </p>
      </div>

      <div>
        <h2 className={H2}>Nous contacter</h2>
        <p>
          Pour toute question sur vos données, écrivez à l'équipe depuis l'adresse associée à votre
          compte. Nous répondons dans un délai de trente jours.
        </p>
      </div>
    </>
  )
}
