import { useState } from 'react'
import { useI18n } from '../../../i18n/useI18n'
import type { ObservatorySkill } from '../../../lib/types'
import { offeredText, SERIES, wantedText } from '../series'

function Bar({ value, max, side }: { value: number; max: number; side: 'wanted' | 'offered' }) {
  if (value === 0) return null
  return (
    <span
      aria-hidden="true"
      className={side === 'wanted' ? 'h-3.5 rounded-l-[2px]' : 'h-3.5 rounded-r-[2px]'}
      style={{ width: `${(value / max) * 100}%`, background: SERIES[side].color }}
    />
  )
}

/**
 * Offre et demande, compétence par compétence : à gauche ceux qui veulent
 * apprendre, à droite ceux qui proposent. Une seule échelle pour les deux côtés,
 * pour que les longueurs se comparent d'un coup d'œil.
 */
export default function SupplyDemandChart({ skills }: { skills: ObservatorySkill[] }) {
  const { t, tn } = useI18n()
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...skills.map((skill) => Math.max(skill.offered, skill.wanted)))

  return (
    <figure className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <figcaption className="text-lg font-semibold text-ink-900">
          {t('Offre et demande, compétence par compétence')}
        </figcaption>
        <ul className="flex gap-5 text-sm text-ink-700" aria-label={t('Légende')}>
          {(['wanted', 'offered'] as const).map((side) => (
            <li key={side} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-[3px]"
                style={{ background: SERIES[side].color }}
              />
              {t(SERIES[side].label)}
            </li>
          ))}
        </ul>
      </div>

      <ul className="flex flex-col gap-1.5">
        {skills.map((skill, index) => {
          const description = t('{skill} : {wanted}, {offered}.', {
            skill: skill.name,
            wanted: wantedText(skill.wanted, tn),
            offered: offeredText(skill.offered, tn),
          })
          return (
            <li
              key={skill.name}
              tabIndex={0}
              aria-label={description}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className="relative grid grid-cols-[1fr_7.5rem_1fr] items-center rounded py-1 outline-none hover:bg-ink-100 focus-visible:bg-ink-100 sm:grid-cols-[1fr_9rem_1fr]"
            >
              <span aria-hidden="true" className="flex items-center justify-end gap-2">
                <span className="text-xs tabular-nums text-ink-600">{skill.wanted || ''}</span>
                <Bar value={skill.wanted} max={max} side="wanted" />
              </span>
              <span
                aria-hidden="true"
                className="border-x border-ink-200 px-2 text-center text-xs leading-tight text-ink-800 sm:text-sm"
              >
                {skill.name}
              </span>
              <span aria-hidden="true" className="flex items-center gap-2">
                <Bar value={skill.offered} max={max} side="offered" />
                <span className="text-xs tabular-nums text-ink-600">{skill.offered || ''}</span>
              </span>

              {active === index && (
                <span
                  role="presentation"
                  className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-[#333] px-2.5 py-1.5 text-xs text-[#ddd] shadow-menu"
                >
                  <strong className="mr-1 text-sm text-white">{skill.name}</strong>
                  <span
                    className="mx-1 inline-block h-0.5 w-3 align-middle"
                    style={{ background: SERIES.wanted.color }}
                  />
                  <strong className="text-white">{skill.wanted}</strong>{' '}
                  {tn(skill.wanted, 'veut l’apprendre', 'veulent l’apprendre')}
                  <span
                    className="mx-1 ml-2 inline-block h-0.5 w-3 align-middle"
                    style={{ background: SERIES.offered.color }}
                  />
                  <strong className="text-ink-900">{skill.offered}</strong>{' '}
                  {tn(skill.offered, 'la propose', 'la proposent')}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <details className="text-sm text-ink-700">
        <summary className="cursor-pointer font-medium text-accent-800">
          {t('Voir les données en tableau')}
        </summary>
        <table className="mt-3 w-full max-w-md text-left">
          <thead>
            <tr className="border-b border-white/10 text-ink-600">
              <th scope="col" className="py-1.5 font-medium">
                {t('Compétence')}
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                {t(SERIES.wanted.label)}
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                {t(SERIES.offered.label)}
              </th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill) => (
              <tr key={skill.name} className="border-b border-ink-200">
                <th scope="row" className="py-1.5 font-normal text-ink-800">
                  {skill.name}
                </th>
                <td className="py-1.5 text-right tabular-nums">{skill.wanted}</td>
                <td className="py-1.5 text-right tabular-nums">{skill.offered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
