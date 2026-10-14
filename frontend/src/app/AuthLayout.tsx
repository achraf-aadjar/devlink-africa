import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/icons/Logo'
import Spinner from '../components/ui/Spinner'
import CircleDiagram from '../features/circles/components/CircleDiagram'
import { DEMO_CIRCLE } from '../features/circles/demoCircle'
import { msg } from '../i18n/translate'
import { useI18n } from '../i18n/useI18n'

/**
 * Enveloppe des écrans d'authentification (connexion, inscription) : ni barre
 * de navigation ni pied de page. Sur grand écran, l'écran est coupé en deux : à
 * gauche une ardoise où se trace le cercle de démonstration, à droite le
 * formulaire. Sous `lg`, l'ardoise disparaît et le formulaire prend toute la
 * largeur.
 *
 * Aucune photo : le produit se montre lui-même, avec des personnes fictives
 * signalées comme telles.
 */
const PANELS = {
  login: {
    title: msg('Vos matchs vous attendent.'),
    text: msg(
      'Chaque proposition est expliquée point par point : vous savez toujours pourquoi un profil vous est proposé.',
    ),
  },
  register: {
    title: msg('Dites ce que vous savez. Dites ce qui vous manque.'),
    text: msg(
      'Dev Match trouve les développeurs qui vous complètent, partout en Afrique. Quand aucune paire ne marche, un cercle fait circuler le savoir.',
    ),
  },
}

export default function AuthLayout() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const panel = pathname.startsWith('/inscription') ? PANELS.register : PANELS.login

  return (
    <div className="grid min-h-screen bg-ink-50 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink-100 focus:px-3 focus:py-2 focus:shadow-lift"
      >
        {t('Aller au contenu')}
      </a>

      <aside className="scope-dark relative hidden flex-col justify-between gap-10 bg-ink-50 p-10 lg:flex xl:p-14">
        <Link
          to="/"
          className="inline-flex w-fit rounded-md p-1 text-ink-900"
          aria-label={t('DevLink Africa, accueil')}
        >
          <Logo size={30} />
        </Link>

        <div className="flex flex-col gap-8">
          <div className="max-w-lg">
            <p className="font-display text-[2.75rem] font-bold uppercase leading-[0.95] text-ink-900 xl:text-[3.25rem]">
              {t(panel.title)}
            </p>
            <p className="mt-4 max-w-md text-ink-700">{t(panel.text)}</p>
          </div>
          <figure className="flex flex-col items-start gap-3">
            <CircleDiagram circle={DEMO_CIRCLE} className="!mx-0 max-w-[22rem]" />
            <figcaption className="text-sm text-ink-600">
              {t('Exemple de cercle : Dakar, Accra, Nairobi. Personnes fictives.')}
            </figcaption>
          </figure>
        </div>
      </aside>

      <div className="flex flex-col">
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
