import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/icons/Logo'
import LanguageSwitch from '../components/LanguageSwitch'
import ThemeSwitch from '../components/ThemeSwitch'
import Spinner from '../components/ui/Spinner'
import { msg } from '../i18n/translate'
import { useI18n } from '../i18n/useI18n'

/**
 * Enveloppe des écrans d'authentification (connexion, inscription) : ni barre
 * de navigation ni pied de page. Sur grand écran, l'écran est coupé en deux : à
 * gauche le portrait d'une bâtisseuse de la tech africaine, sous un voile, avec
 * une de ses phrases ; à droite le formulaire. Sous `lg`, le portrait
 * disparaît et le formulaire prend toute la largeur.
 *
 * Photos sous licence libre et citations sourcées : voir LICENSES.md.
 */
const SLIDES = {
  login: {
    image: '/auth/rotich.webp',
    quote: msg(
      '« Il existe une autre tribu à laquelle je me sens liée : celle d’Internet, qui dépasse les cultures et la géographie. »',
    ),
    author: 'Juliana Rotich',
    role: msg('cofondatrice d’Ushahidi et de BRCK, Kenya'),
    quoteSource: 'TechCentral, 2013',
    quoteHref: 'https://techcentral.co.za/?p=187844',
    credit: 'World Economic Forum (Martin Dixon), CC BY-SA 2.0',
    creditHref:
      'https://commons.wikimedia.org/wiki/File:Juliana_Rotich_-_World_Economic_Forum_on_Africa_2012.jpg',
  },
  register: {
    image: '/auth/enonchong.webp',
    quote: msg('« Travaillez dur, voyez grand, et n’abandonnez jamais. »'),
    author: 'Rebecca Enonchong',
    role: msg('fondatrice d’AppsTech, Cameroun'),
    quoteSource: 'How we made it in Africa, 2013',
    quoteHref: 'https://www.howwemadeitinafrica.com/meet-the-boss-rebecca-enonchong-ceo-appstech/',
    credit: 'Minette Lontsie, CC BY-SA 4.0',
    creditHref: 'https://commons.wikimedia.org/wiki/File:Rebecca_Enonchong_in_2018.jpg',
  },
}

export default function AuthLayout() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const slide = pathname.startsWith('/inscription') ? SLIDES.register : SLIDES.login

  return (
    <div className="grid min-h-screen bg-ink-50 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink-100 focus:px-3 focus:py-2 focus:shadow-lift"
      >
        {t('Aller au contenu')}
      </a>

      <aside className="relative hidden overflow-hidden bg-bar lg:block">
        <img
          src={slide.image}
          alt=""
          width={1120}
          height={1400}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[50%_20%] grayscale"
        />
        {/* Voile : léger en haut pour le logo, dense en bas pour la citation. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-bar via-bar/55 to-bar/25"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-bar/85 to-transparent"
        />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link
            to="/"
            className="inline-flex w-fit rounded-md p-1 text-white"
            aria-label={t('DevLink Africa, accueil')}
          >
            <Logo size={30} variant="bar" />
          </Link>

          <figure className="max-w-xl">
            <blockquote className="font-display text-[2.25rem] font-bold leading-[1.05] text-white xl:text-[2.75rem]">
              {t(slide.quote)}
            </blockquote>
            <figcaption className="mt-5 text-bar-text">
              <span className="block font-display text-xl font-bold uppercase text-white">
                {slide.author}
              </span>
              <span className="text-sm text-bar-muted">{t(slide.role)}</span>
            </figcaption>
          </figure>
        </div>

        <p className="absolute bottom-3 right-4 text-right text-xs text-bar-muted">
          {t('Citation')} :{' '}
          <a
            href={slide.quoteHref}
            className="underline hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            {slide.quoteSource}
          </a>
          {' · '}
          {t('Photo')} :{' '}
          <a
            href={slide.creditHref}
            className="underline hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            {slide.credit}
          </a>
        </p>
      </aside>

      <div className="relative flex flex-col">
        {/* Un visiteur peut arriver directement sur /connexion ou /inscription
            (lien partagé, retour arrière) sans jamais passer par la navbar
            principale : la bascule clair/sombre et la langue doivent donc
            exister ici aussi, pas seulement dans Layout.tsx. */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 sm:right-6 sm:top-6">
          <ThemeSwitch tone="ink" />
          <LanguageSwitch tone="ink" />
        </div>

        <header className="flex justify-center px-4 pt-8 lg:hidden">
          <Link
            to="/"
            className="inline-flex rounded-md p-1 text-ink-900"
            aria-label={t('DevLink Africa, accueil')}
          >
            <Logo size={30} />
          </Link>
        </header>

        <main id="contenu" className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10">
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
