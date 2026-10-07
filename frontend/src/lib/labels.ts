/** Libellés français des énumérations de l'API. Un seul endroit à traduire. */

import type {
  Availability,
  Domain,
  ExchangeStatus,
  ExchangeType,
  JoinRequestStatus,
  ProjectStatus,
  ReportReason,
  SkillCategory,
  SkillLevel,
  SkillProofKind,
} from './types'

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  MENTORING: 'Mentorat',
  COLLABORATION: 'Collaboration',
  OPEN_SOURCE: 'Open source',
  FREELANCE: 'Freelance',
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  WEB: 'Web',
  MOBILE: 'Mobile',
  DATA: 'Données',
  DEVOPS: 'DevOps',
  DESIGN: 'Design',
  IA: 'Intelligence artificielle',
  SECURITE: 'Sécurité',
  EMBARQUE: 'Embarqué',
}

export const LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
}

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  FRONTEND: 'Front-end',
  BACKEND: 'Back-end',
  MOBILE: 'Mobile',
  DATA: 'Données',
  DEVOPS: 'DevOps',
  DESIGN: 'Design',
  AUTRE: 'Autre',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  OPEN: 'Ouvert aux contributions',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CLOSED: 'Fermé',
}

export const JOIN_STATUS_LABELS: Record<JoinRequestStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  DECLINED: 'Refusée',
}

export const EXCHANGE_TYPE_LABELS: Record<ExchangeType, string> = {
  PAIR_PROGRAMMING: 'Pair programming',
  CODE_REVIEW: 'Revue de code',
  MENTORAT: 'Mentorat',
  DEBUGGING: 'Débogage',
  PROJET_COMMUN: 'Projet commun',
  PREPARATION_ENTRETIEN: "Préparation d'entretien",
  ECHANGE_COMPETENCES: 'Échange de compétences',
  DISCUSSION: 'Discussion',
}

export const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
  PROPOSED: 'Proposé',
  ACCEPTED: 'Accepté',
  DECLINED: 'Refusé',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

export const PROOF_KIND_LABELS: Record<SkillProofKind, string> = {
  PROJECT: 'Projet',
  GITHUB_REPO: 'Dépôt de code',
  OPEN_SOURCE: 'Contribution open source',
  CERTIFICATION: 'Certification',
  CHALLENGE: 'Challenge',
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam ou publicité',
  HARASSMENT: 'Harcèlement',
  FAKE_PROFILE: 'Faux profil',
  INAPPROPRIATE: 'Contenu inapproprié',
  OTHER: 'Autre',
}

/** Drapeau en emoji depuis un code pays ISO 3166-1 alpha-2. */
export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return ''
  return [...code.toUpperCase()]
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join('')
}
