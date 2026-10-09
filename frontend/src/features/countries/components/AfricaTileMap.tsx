import { Link } from 'react-router-dom'
import { useI18n } from '../../../i18n/useI18n'
import { cn } from '../../../lib/cn'
import { localCountryName } from '../../../lib/countryName'
import type { Country } from '../../../lib/types'

/**
 * Carte de l'Afrique en tuiles (DL-37).
 *
 * Pourquoi des tuiles et non une carte vectorielle : les fichiers de contours
 * géographiques sont presque tous sous une licence qui nous est interdite, ou
 * sans licence claire. Cette grille est dessinée par nous, à partir des seuls
 * codes pays : aucune donnée cartographique tierce (voir docs/DECISIONS.md).
 *
 * Chaque tuile est placée à la main selon la position approximative du pays sur
 * le continent. L'intérêt est de donner un repère visuel, pas une exactitude
 * géographique : la liste reste l'outil de navigation principal.
 */

/** Position de chaque pays dans la grille : [colonne, ligne], de 1 à 9. */
const GRID: Record<string, [number, number]> = {
  // Maghreb
  MA: [2, 1],
  DZ: [3, 1],
  TN: [4, 1],
  LY: [5, 1],
  EG: [6, 1],
  // Sahel occidental
  MR: [1, 2],
  ML: [2, 2],
  NE: [3, 2],
  TD: [4, 2],
  SD: [5, 2],
  ER: [6, 2],
  // Afrique de l'Ouest côtière
  CV: [1, 3],
  SN: [1, 4],
  GM: [1, 5],
  GW: [2, 5],
  GN: [2, 4],
  SL: [2, 3],
  LR: [3, 3],
  CI: [3, 4],
  BF: [3, 5],
  GH: [4, 4],
  TG: [4, 5],
  BJ: [5, 5],
  NG: [5, 4],
  // Afrique centrale
  CM: [5, 3],
  CF: [6, 3],
  GQ: [4, 3],
  GA: [4, 6],
  CG: [5, 6],
  CD: [6, 6],
  AO: [5, 7],
  ST: [3, 6],
  // Corne de l'Afrique
  ET: [7, 2],
  DJ: [7, 1],
  SO: [8, 2],
  SS: [6, 4],
  // Afrique de l'Est
  UG: [7, 3],
  KE: [8, 3],
  RW: [7, 4],
  BI: [7, 5],
  TZ: [8, 4],
  SC: [9, 4],
  KM: [9, 5],
  MG: [9, 6],
  MU: [9, 7],
  // Afrique australe
  ZM: [6, 7],
  MW: [7, 6],
  MZ: [8, 6],
  ZW: [7, 7],
  BW: [6, 8],
  NA: [5, 8],
  ZA: [6, 9],
  LS: [7, 9],
  SZ: [7, 8],
}

export default function AfricaTileMap({ countries }: { countries: Country[] }) {
  const { t, lang } = useI18n()
  const byCode = new Map(countries.map((country) => [country.code, country]))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-600">
        {t(
          'Chaque point représente un pays. Ceux en couleur comptent au moins un développeur ou un projet.',
        )}
      </p>

      <div
        role="group"
        aria-label={t("Carte de l'Afrique par pays")}
        // Grille de 9 colonnes, qui défile horizontalement sur petit écran
        // sans jamais déborder de la page.
        className="grid w-full max-w-xl grid-cols-9 gap-1.5"
      >
        {Object.entries(GRID).map(([code, [column, row]]) => {
          const country = byCode.get(code)
          const populated = Boolean(
            country && country.developers_count + country.projects_count > 0,
          )
          const name = localCountryName(code, country?.name ?? code, lang)
          const label = populated
            ? t('{name} : {developers} développeur(s), {projects} projet(s)', {
                name,
                developers: country?.developers_count ?? 0,
                projects: country?.projects_count ?? 0,
              })
            : t('{name} : aucune inscription pour le moment', { name })

          return (
            <Link
              key={code}
              to={`/pays/${code}`}
              title={label}
              aria-label={label}
              style={{ gridColumn: column, gridRow: row }}
              className={cn(
                'flex aspect-square items-center justify-center rounded-full text-[0.6rem] font-semibold transition duration-200 hover:scale-110 sm:text-xs',
                populated
                  ? 'bg-gradient-to-br from-[#1f6feb] to-[#a371f7] text-white shadow-glow'
                  : // Les pays sans donnée restent gris mais cliquables, comme
                    // l'exige le ticket.
                    'bg-white/[0.05] text-ink-500 hover:bg-white/10 hover:text-ink-800',
              )}
            >
              {code}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
