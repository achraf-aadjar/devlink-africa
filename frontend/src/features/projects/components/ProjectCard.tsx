import { Link } from 'react-router-dom'
import Icon from '../../../components/icons/Icon'
import { Badge, Card } from '../../../components/ui'
import { formatRelativeDate, shortenUrl } from '../../../lib/date'
import { countryFlag, PROJECT_STATUS_LABELS } from '../../../lib/labels'
import type { Project } from '../../../lib/types'

const STATUS_TONE = {
  OPEN: 'success',
  IN_PROGRESS: 'accent',
  COMPLETED: 'neutral',
  CLOSED: 'neutral',
} as const

export default function ProjectCard({ project }: { project: Project }) {
  const updated = formatRelativeDate(project.updated_at)

  return (
    <Card as="li" interactive className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1f6feb]/30 to-[#a371f7]/20 text-accent-800 ring-1 ring-inset ring-accent-400/30"
        >
          <Icon name="project" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
            <h2 className="min-w-0 break-words font-semibold text-ink-900">
              <Link to={`/projets/${project.id}`} className="hover:text-accent-700 hover:underline">
                {project.title}
              </Link>
            </h2>
            <Badge tone={STATUS_TONE[project.status]} className="shrink-0">
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-500 hover:text-accent-700 hover:underline"
            >
              <Icon name="external" size={12} />
              <span className="truncate">{shortenUrl(project.repo_url)}</span>
            </a>
          )}
        </div>
      </div>

      {project.description && (
        <p className="line-clamp-3 text-sm text-ink-600">{project.description}</p>
      )}

      {project.needs.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {project.needs.map((skill) => (
            <li key={skill.id}>
              <Badge tone="wanted">{skill.name}</Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-ink-600">
        <p>
          Porté par{' '}
          <Link to={`/developpeurs/${project.owner.id}`} className="hover:underline">
            {project.owner.full_name || 'un développeur'}
          </Link>
          {project.owner.country && (
            <>
              {' '}
              <span aria-hidden="true">{countryFlag(project.owner.country)}</span>
            </>
          )}
        </p>
        <p className="text-xs text-ink-500">
          {updated && `Mis à jour ${updated}`}
          {project.join_requests_count > 0 && (
            <>
              {updated ? ' · ' : ''}
              {project.join_requests_count} demande
              {project.join_requests_count > 1 ? 's' : ''}
            </>
          )}
        </p>
      </div>
    </Card>
  )
}
