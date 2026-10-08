/** Types des réponses de l'API, alignés sur docs/api.md (contrat gelé DL-04). */

export type Availability = 'MENTORING' | 'COLLABORATION' | 'OPEN_SOURCE' | 'FREELANCE'
export type Domain =
  'WEB' | 'MOBILE' | 'DATA' | 'DEVOPS' | 'DESIGN' | 'IA' | 'SECURITE' | 'EMBARQUE'
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type SkillKind = 'OFFERED' | 'WANTED'
export type SkillCategory =
  'FRONTEND' | 'BACKEND' | 'MOBILE' | 'DATA' | 'DEVOPS' | 'DESIGN' | 'AUTRE'
export type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
export type JoinRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'
export type ExchangeType =
  | 'PAIR_PROGRAMMING'
  | 'CODE_REVIEW'
  | 'MENTORAT'
  | 'DEBUGGING'
  | 'PROJET_COMMUN'
  | 'PREPARATION_ENTRETIEN'
  | 'ECHANGE_COMPETENCES'
  | 'DISCUSSION'
export type ExchangeStatus = 'PROPOSED' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED'
export type ReportTargetType = 'USER' | 'PROJECT'
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'FAKE_PROFILE' | 'INAPPROPRIATE' | 'OTHER'
export type SkillProofKind =
  'PROJECT' | 'GITHUB_REPO' | 'OPEN_SOURCE' | 'CERTIFICATION' | 'CHALLENGE'

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiErrorBody {
  detail: string
  code: string
  errors?: Record<string, string[]>
}

// --- Authentification et profil --------------------------------------------

export interface User {
  id: number
  email: string
  full_name: string
  date_joined: string
}

export interface Profile {
  country: string
  bio: string
  availability: Availability[]
  domains: Domain[]
  avatar_url: string
  /** Adresse e-mail ou lien https, montré seulement aux partenaires d'un échange accepté. */
  contact: string
  is_demo: boolean
  completeness: number
}

export interface Me extends User {
  profile: Profile
}

export interface TokenPair {
  access: string
  refresh: string
  user: User
}

// --- Compétences ------------------------------------------------------------

export interface Skill {
  id: number
  name: string
  category: SkillCategory
}

export interface SkillProof {
  id: number
  kind: SkillProofKind
  title: string
  url: string
  description: string
  created_at: string
}

export interface UserSkill {
  id: number
  skill: Skill
  kind: SkillKind
  level: SkillLevel
  proofs_count: number
  proofs?: SkillProof[]
}

export interface MySkills {
  offered: UserSkill[]
  wanted: UserSkill[]
}

// --- Profil public ----------------------------------------------------------

export interface PublicProfile {
  id: number
  full_name: string
  country: string
  bio: string
  availability: Availability[]
  domains: Domain[]
  avatar_url: string
  is_demo: boolean
  skills: { offered: UserSkill[]; wanted: UserSkill[] }
  projects: Array<{ id: number; title: string; status: ProjectStatus }>
}

// --- Projets ----------------------------------------------------------------

export interface ProjectOwner {
  id: number
  full_name: string
  country: string
  is_demo: boolean
}

export interface JoinRequest {
  id: number
  project: number
  applicant: { id: number; full_name: string }
  message: string
  status: JoinRequestStatus
  created_at: string
}

export interface Project {
  id: number
  title: string
  description: string
  status: ProjectStatus
  needs: Skill[]
  repo_url: string
  demo_url: string
  owner: ProjectOwner
  join_requests_count: number
  created_at: string
  updated_at: string
  join_requests?: JoinRequest[]
}

// --- Dev Match --------------------------------------------------------------

export interface MatchPartner {
  id: number
  full_name: string
  country: string
  avatar_url: string
  is_demo: boolean
}

export interface CriterionScore {
  criterion: string
  label: string
  weight: number
  points: number
}

export interface MatchExplanation {
  breakdown: CriterionScore[]
  they_can_teach_you: Array<{ name: string; level: SkillLevel }>
  you_can_teach_them: Array<{ name: string; level: SkillLevel }>
  common_skills: Array<{ name: string }>
  capped: boolean
  reasons: string[]
}

export interface MatchFeedback {
  id: number
  match: number
  is_relevant: boolean
  comment: string
  created_at: string
}

export interface MatchSummary {
  id: number
  user: MatchPartner
  score: number
  reasons: string[]
  computed_at: string
}

export interface MatchDetail extends MatchSummary {
  explanation: MatchExplanation
  my_feedback: MatchFeedback | null
}

// --- Échanges ---------------------------------------------------------------

/** Participant à un échange. `contact` n'est rempli qu'une fois l'échange accepté. */
export interface ExchangeParty {
  id: number
  full_name: string
  contact: string | null
}

export interface Exchange {
  id: number
  type: ExchangeType
  status: ExchangeStatus
  message: string
  skill: Skill | null
  requester: ExchangeParty
  partner: ExchangeParty
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

// --- Recherche et pays ------------------------------------------------------

export interface SearchUser {
  id: number
  full_name: string
  country: string
  bio: string
  avatar_url: string
  is_demo: boolean
  availability: Availability[]
  offered_skills: Skill[]
  wanted_skills: Skill[]
}

export interface Country {
  code: string
  name: string
  flag: string
  developers_count: number
  projects_count: number
}

export interface CountryDetail extends Country {
  top_skills: Array<{ id: number; name: string; count: number }>
  developers: SearchUser[]
  projects: Project[]
}

// --- Tableau de bord --------------------------------------------------------

export interface Dashboard {
  profile_completeness: number
  has_contact: boolean
  recommended_matches: MatchSummary[]
  pending_exchanges: { received: number; sent: number; items: Exchange[] }
  pending_join_requests: { count: number; items: JoinRequest[] }
  my_projects: Project[]
  counters: { offered_skills: number; wanted_skills: number; matches: number; exchanges: number }
}

export interface Health {
  status: string
  version: string
}
