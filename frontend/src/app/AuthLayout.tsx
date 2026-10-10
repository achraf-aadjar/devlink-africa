import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/icons/Logo'
import Spinner from '../components/ui/Spinner'
import { msg } from '../i18n/translate'
import { useI18n } from '../i18n/useI18n'

/**
 * Enveloppe des écrans d'authentification (connexion, inscription) : ni barre
 * de navigation ni pied de page. L'écran est coupé en deux : à gauche une
 * illustration (portrait, voile, citation), à droite le formulaire. Sous `lg`
 * l'illustration disparaît et le formulaire prend toute la largeur.
 *
 * Chaque écran a sa propre illustration et sa propre citation (voir `SLIDES`).
 * Crédits des photos : LICENSES.md.
 */
const SLIDES = {
  login: {
    image: '/auth/portrait.jpg',
    quote: msg(
      '« Les grandes choses ne sont jamais accomplies par une seule personne. Elles le sont par une équipe. »',
    ),
    author: 'Steve Jobs',
    role: msg('cofondateur d’Apple'),
    creditHref: 'https://commons.wikimedia.org/wiki/File:Steve_Jobs_Headshot_2010-CROP.jpg',
    credit: 'Matthew Yohe, CC BY-SA 3.0',
  },
  register: {
    image: '/auth/portrait-register.jpg',
    quote: msg('« La phrase la plus dangereuse : “on a toujours fait comme ça”. »'),
    author: 'Grace Hopper',
    role: msg('pionnière de l’informatique'),
    creditHref:
      'https://commons.wikimedia.org/wiki/File:Commodore_Grace_M._Hopper,_USN_(covered).jpg',
    credit: 'James S. Davis, domaine public',
  },
}

export default function AuthLayout() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const slide = pathname.startsWith('/inscription') ? SLIDES.register : SLIDES.login

  return (
    <div className="grid min-h-screen bg-ink-50 lg:grid-cols-2">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink-100 focus:px-3 focus:py-2 focus:shadow-card"
      >
        {t('Aller au contenu')}
      </a>

      <aside className="relative hidden overflow-hidden bg-[#0d1117] lg:block">
        <img
          src={slide.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top grayscale"
        />
        {/* Voile : bleu de marque en haut, noir en bas pour porter la citation. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/60 to-brand/40"
        />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link
            to="/"
            className="inline-flex w-fit rounded-lg p-1 text-[#e6edf3]"
            aria-label={t('DevLink Africa, accueil')}
          >
            <Logo size={32} />
          </Link>

          <figure className="max-w-xl">
            <blockquote className="text-2xl font-semibold leading-snug tracking-tight text-white xl:text-3xl">
              {t(slide.quote)}
            </blockquote>
            <figcaption className="mt-5 text-sm text-[#c9d1d9]">
              <span className="font-semibold text-white">{slide.author}</span>
              <span className="text-[#adb5bd]"> · {t(slide.role)}</span>
            </figcaption>
          </figure>
        </div>

        <p className="absolute bottom-2 right-3 text-xs text-[#adb5bd]">
          {t('Photo')} :{' '}
          <a
            href={slide.creditHref}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {slide.credit}
          </a>
        </p>
      </aside>

      <div className="relative isolate flex flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 lg:hidden"
        >
          <div className="bg-aurora absolute inset-0" />
        </div>

        <header className="flex justify-center px-4 pt-8 lg:hidden">
          <Link
            to="/"
            className="inline-flex rounded-lg p-1 text-ink-900"
            aria-label={t('DevLink Africa, accueil')}
          >
            <Logo size={32} />
          </Link>
        </header>

        <main
          id="contenu"
          className="auth-plain flex flex-1 flex-col justify-center px-6 py-10 sm:px-10"
        >
          <Suspense
            fallback={
              <div
                role="status"
                className="flex items-center justify-center gap-3 py-24 text-ink-600"
              >
                <Spinner className="h-5 w-5" />
                <span>{t('Chargement…')}</span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
