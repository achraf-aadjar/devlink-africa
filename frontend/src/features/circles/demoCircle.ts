import type { Circle } from '../../lib/types'

/**
 * Le cercle de démonstration de l'accueil et des écrans de connexion, tel que
 * `seed_demo` le crée : Aminata (Dakar) apprend React à Kwame (Accra), qui
 * apprend FastAPI à Imani (Nairobi), qui apprend Docker à Aminata. Aucune de
 * ces paires n'est réciproque : seul le cercle fait circuler le savoir.
 *
 * Personnes fictives, signalées comme telles là où le cercle est affiché.
 * Les flèches suivent l'ordre des membres : la flèche `i` va du membre `i`
 * au membre suivant.
 */
export const DEMO_CIRCLE: Circle = {
  id: null,
  key: 'demo',
  status: 'SUGGESTED',
  score: 100,
  created_at: null,
  activated_at: null,
  members: [
    {
      id: 1,
      full_name: 'Aminata Diallo',
      country: 'SN',
      is_demo: true,
      response: null,
      contact: null,
    },
    {
      id: 2,
      full_name: 'Kwame Boateng',
      country: 'GH',
      is_demo: true,
      response: null,
      contact: null,
    },
    {
      id: 3,
      full_name: 'Imani Wanjiru',
      country: 'KE',
      is_demo: true,
      response: null,
      contact: null,
    },
  ],
  arrows: [
    { teacher: 1, learner: 2, skill: { name: 'React', level: 'ADVANCED' } },
    { teacher: 2, learner: 3, skill: { name: 'FastAPI', level: 'ADVANCED' } },
    { teacher: 3, learner: 1, skill: { name: 'Docker', level: 'ADVANCED' } },
  ],
}
