import { LEVEL_LABELS } from '../lib/labels'
import type { SkillKind, SkillLevel } from '../lib/types'
import { Badge } from './ui'

export default function SkillBadge({
  name,
  kind,
  level,
  proofsCount = 0,
  endorsements = 0,
}: {
  name: string
  kind?: SkillKind
  level?: SkillLevel
  proofsCount?: number
  /** Nombre de pairs qui ont validé la compétence. */
  endorsements?: number
}) {
  const tone = kind === 'WANTED' ? 'wanted' : kind === 'OFFERED' ? 'offered' : 'neutral'

  return (
    <Badge tone={tone}>
      {name}
      {level && <span className="ml-1 font-normal opacity-80">· {LEVEL_LABELS[level]}</span>}
      {proofsCount > 0 && (
        <span className="ml-1 font-normal opacity-80" title={`${proofsCount} preuve(s)`}>
          · {proofsCount} ✓
        </span>
      )}
      {endorsements > 0 && (
        <span className="ml-1 font-semibold">
          · validée{endorsements > 1 ? ` ×${endorsements}` : ''}
        </span>
      )}
    </Badge>
  )
}
