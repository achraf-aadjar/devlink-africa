import { useQuery } from '../../../lib/useQuery'
import { Combobox } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { localCountryName } from '../../../lib/countryName'
import { listCountryChoices } from '../../search/api/search'

/**
 * Liste des pays. On réutilise la liste du serveur plutôt que de la dupliquer
 * côté client : une seule source de vérité sur les codes autorisés. Les noms
 * suivent la langue de l'interface, et l'ordre alphabétique aussi.
 */
export default function CountrySelect({
  value,
  error,
  onChange,
  label,
}: {
  value: string
  error?: string
  onChange: (code: string) => void
  /** Déjà traduit. Par défaut, « Pays ». */
  label?: string
}) {
  const { t, lang } = useI18n()
  const { data } = useQuery(() => listCountryChoices(), [])

  const collator = new Intl.Collator(lang)
  const options = (data?.results ?? [])
    .map((country) => ({
      code: country.code,
      flag: country.flag,
      name: localCountryName(country.code, country.name, lang),
    }))
    .sort((a, b) => collator.compare(a.name, b.name))
    .map((country) => ({ value: country.code, label: `${country.flag} ${country.name}` }))

  return (
    <Combobox
      label={label ?? t('Pays')}
      value={value}
      error={error}
      options={options}
      placeholder={t('Choisir un pays')}
      onChange={onChange}
    />
  )
}
