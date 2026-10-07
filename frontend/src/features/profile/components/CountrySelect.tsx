import { useQuery } from '../../../lib/useQuery'
import { Select } from '../../../components/ui'
import { listCountryChoices } from '../../search/api/search'

/**
 * Liste des pays. On réutilise la liste du serveur plutôt que de la dupliquer
 * côté client : une seule source de vérité pour les codes autorisés.
 */
export default function CountrySelect({
  value,
  error,
  onChange,
  label = 'Pays',
}: {
  value: string
  error?: string
  onChange: (code: string) => void
  label?: string
}) {
  const { data } = useQuery(() => listCountryChoices(), [])

  const options = (data?.results ?? []).map((country) => ({
    value: country.code,
    label: `${country.flag} ${country.name}`,
  }))

  return (
    <Select
      label={label}
      value={value}
      error={error}
      options={options}
      placeholder="Choisir un pays"
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
