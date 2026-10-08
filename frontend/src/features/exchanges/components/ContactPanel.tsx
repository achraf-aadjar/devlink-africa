import { Link } from 'react-router-dom'
import Icon from '../../../components/icons/Icon'
import type { ExchangeParty } from '../../../lib/types'

/**
 * Lien vers un moyen de contact. Le backend n'accepte qu'une adresse e-mail ou
 * un lien https ; on revérifie ici avant d'en faire un lien, pour ne jamais
 * produire autre chose qu'un `mailto:` ou un `https:`.
 */
function contactHref(contact: string): string | null {
  if (contact.startsWith('https://')) return contact
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return `mailto:${contact}`
  return null
}

/**
 * Ce que l'acceptation débloque : le moyen de joindre l'autre. Si l'un des
 * deux n'a pas renseigné le sien, on le dit, et on invite l'utilisateur à
 * compléter le sien plutôt que de le laisser sans suite.
 */
export default function ContactPanel({ other, me }: { other: ExchangeParty; me: ExchangeParty }) {
  const href = other.contact ? contactHref(other.contact) : null

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-emerald-950/40 px-5 py-4 ring-1 ring-inset ring-emerald-400/20">
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
        <Icon name="check" size={16} />
        Échange accepté : vous pouvez vous contacter.
      </p>
      {other.contact && href ? (
        <p className="text-sm text-ink-800">
          Pour joindre {other.full_name} :{' '}
          <a
            href={href}
            target={href.startsWith('https://') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="break-all font-medium text-accent-800 underline hover:text-accent-900"
          >
            {other.contact}
          </a>
        </p>
      ) : (
        <p className="text-sm text-ink-700">
          {other.full_name} n'a pas encore indiqué de moyen de contact. Il apparaîtra ici dès qu'il
          sera renseigné.
        </p>
      )}
      {!me.contact && (
        <p className="text-sm text-ink-700">
          Vous non plus n'avez pas indiqué le vôtre :{' '}
          <Link to="/profil" className="font-medium text-accent-800 underline">
            ajoutez-le dans Mon profil
          </Link>{' '}
          pour que {other.full_name} puisse vous joindre.
        </p>
      )}
    </div>
  )
}
