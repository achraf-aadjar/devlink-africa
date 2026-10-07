import { Link } from 'react-router-dom'
import { Badge, Card } from '../../../components/ui'
import { countryFlag, PROJECT_STATUS_LABELS } from '../../../lib/labels'
import type { Project } from '../../../lib/types'

const STATUS_TONE = {
  OPEN: 'success',
  IN_PROGRESS: 'accent',
  COMPLETED: 'neutral',
  CLOSED: 'neutral',
} as const

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Card as="li" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-ink-900">
          <Link to={`/projets/${project.id}`} className="hover:text-accent-700 hover:underline">
            {project.title}
          </Link>
        </h2>
        <Badge tone={STATUS_TONE[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
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

      <p className="mt-auto text-sm text-ink-600">
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
        {project.join_requests_count > 0 && (
          <span className="ml-2 text-ink-500">
            · {project.join_requests_count} demande
            {project.join_requests_count > 1 ? 's' : ''}
          </span>
        )}
      </p>
    </Card>
  )
}
