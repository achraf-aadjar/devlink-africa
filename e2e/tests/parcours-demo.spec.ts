import { expect, test, type Page } from '@playwright/test'

/**
 * Le parcours de démonstration de docs/demo.md, dans un vrai navigateur.
 *
 * Une nouvelle développeuse sait React et veut apprendre Docker. Mamadou Bâ
 * (profil de démonstration) sait Docker et veut apprendre React : il doit
 * arriver en tête de ses matchs. Elle lui propose un mentorat, il accepte, et
 * chacun obtient alors le moyen de contacter l'autre.
 */

const PASSWORD = 'mot-de-passe-solide-2026'
const DEMO_PASSWORD = 'demo-devlink-2026-xyz'
const RECIPIENT = { name: 'Mamadou Bâ', email: 'mamadou@demo.devlink.africa' }

async function login(page: Page, email: string, password: string) {
  await page.goto('/connexion')
  await page.getByLabel('Adresse e-mail').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/tableau-de-bord/)
}

async function addSkill(page: Page, column: string, label: string) {
  const region = page.getByRole('region', { name: column })
  await region.getByLabel('Ajouter une compétence').selectOption({ label })
  if (column === 'Je sais faire') {
    await region.getByLabel('Votre niveau').selectOption({ label: 'Avancé' })
  }
  await region.getByRole('button', { name: 'Ajouter' }).click()
  await expect(page.getByText(/Vos matchs ont été recalculés/)).toBeVisible()
}

test('le parcours de démonstration, de l’inscription au contact', async ({ browser }) => {
  const email = `awa.${Date.now()}@example.org`
  const ada = await browser.newPage()

  // Étape 1 : l'accueil présente le problème.
  await ada.goto('/')
  await expect(ada.getByRole('heading', { level: 1 })).toContainText('Apprenez ce qui vous manque')

  // Étape 2 : inscription avec consentement explicite.
  await ada.getByRole('link', { name: 'S’inscrire' }).first().click()
  await ada.getByLabel('Nom complet').fill('Awa Sarr')
  await ada.getByLabel('Adresse e-mail').fill(email)
  await ada.getByLabel('Mot de passe').fill(PASSWORD)
  await ada.getByRole('checkbox').check()
  await ada.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(ada).toHaveURL(/tableau-de-bord/)
  await expect(ada.getByRole('heading', { name: 'Vos premiers pas' })).toBeVisible()

  // Le profil, avec un moyen de contact.
  await ada.goto('/profil')
  // Pays : liste déroulante avec recherche (pas un <select> natif), on tape
  // puis on choisit dans la liste qui s'ouvre.
  await ada.getByLabel('Pays').fill('Sénégal')
  await ada.getByRole('option', { name: '🇸🇳 Sénégal' }).click()
  await ada
    .getByLabel('Présentation')
    .fill('Développeuse front-end à Thiès, curieuse du déploiement.')
  await ada.getByRole('checkbox', { name: 'Mentorat' }).check()
  await ada.getByRole('checkbox', { name: 'Web' }).check()
  await ada.getByLabel('Moyen de contact').fill('https://github.com/awa-sarr-demo')
  await ada.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(ada.getByText('Votre profil est enregistré.')).toBeVisible()

  // Étape 3 : ce qu'elle sait, ce qu'elle veut apprendre.
  await ada.goto('/competences')
  await addSkill(ada, 'Je sais faire', 'React — Front-end')
  await addSkill(ada, 'Je veux apprendre', 'Docker — DevOps')

  // Étape 4 : Dev Match propose Mamadou en tête.
  await ada.goto('/matchs')
  await expect(ada.getByRole('heading', { level: 2 }).first()).toHaveText(RECIPIENT.name)

  // Étape 5 : l'explication du match, score compris.
  await ada.getByRole('link', { name: RECIPIENT.name }).first().click()
  await expect(ada.getByRole('heading', { level: 1 })).toHaveText(RECIPIENT.name)
  await expect(ada.getByRole('img', { name: /Score de \d+ sur 100/ })).toBeVisible()
  await expect(
    ada.getByRole('heading', { name: `${RECIPIENT.name} peut vous apprendre` }),
  ).toBeVisible()
  await expect(ada.getByRole('meter')).toHaveCount(6)

  // Étape 6 : la demande d'échange.
  await ada.getByRole('button', { name: 'Proposer un échange' }).click()
  const dialog = ada.getByRole('dialog')
  await dialog.getByLabel("Type d'échange").selectOption({ label: 'Mentorat' })
  await dialog
    .getByLabel('Votre message')
    .fill('Bonjour Mamadou, tu me montrerais Docker ? Je t’aide sur React.')
  await dialog.getByRole('button', { name: 'Envoyer la demande' }).click()
  await expect(dialog).toBeHidden()

  // Mamadou voit la demande signalée dans la barre, et l'accepte.
  const context = await browser.newContext()
  const mamadou = await context.newPage()
  await login(mamadou, RECIPIENT.email, DEMO_PASSWORD)
  await expect(
    mamadou.getByRole('link', { name: /^Échanges\s*\(\d+ demandes? en attente\)$/ }),
  ).toBeVisible()
  await mamadou.goto('/echanges')
  const request = mamadou.getByRole('listitem').filter({ hasText: 'Awa Sarr' })
  await request.getByRole('button', { name: 'Accepter' }).click()
  await expect(request.getByText('Échange accepté : vous pouvez vous contacter.')).toBeVisible()
  await expect(
    request.getByRole('link', { name: 'https://github.com/awa-sarr-demo' }),
  ).toBeVisible()

  // La boucle est fermée : Awa obtient le contact de Mamadou.
  await ada.goto('/echanges')
  await ada.getByRole('tab', { name: 'Envoyées' }).click()
  await expect(ada.getByRole('link', { name: RECIPIENT.email })).toHaveAttribute(
    'href',
    `mailto:${RECIPIENT.email}`,
  )

  // Étape 7 : Project Hub, demande pour rejoindre Agri-Collecte.
  await ada.goto('/projets')
  await ada.getByRole('link', { name: 'Agri-Collecte' }).click()
  await ada.getByRole('button', { name: 'Rejoindre le projet' }).click()
  await ada.getByRole('dialog').getByLabel('Votre message').fill('Je peux aider sur l’interface.')
  await ada.getByRole('dialog').getByRole('button', { name: 'Envoyer' }).click()
  await expect(ada.getByRole('dialog')).toBeHidden()

  // Étape 8 : la vision, pays par pays.
  await ada.goto('/pays')
  await expect(ada.getByRole('link', { name: /Sénégal/ }).first()).toBeVisible()

  await context.close()
})

test('un cercle d’échange : Dakar → Accra → Nairobi', async ({ browser }) => {
  // Aminata, Kwame et Imani n'ont aucune paire réciproque : seul le cercle les réunit.
  const sessions: Page[] = []
  async function as(email: string) {
    const page = await (await browser.newContext()).newPage()
    sessions.push(page)
    await login(page, email, DEMO_PASSWORD)
    return page
  }
  // La carte du cercle à trois : celle dont le schéma mentionne FastAPI, sans
  // Clarisse (qui forme un autre cercle, à quatre). Repérée par son schéma, car
  // les phrases changent selon le membre qui lit (« Vous apprenez… »).
  const trio = (page: Page) =>
    page
      .getByRole('listitem')
      .filter({ has: page.getByRole('img', { name: /^Cercle d'échange\..*FastAPI/ }) })
      .filter({ hasNotText: 'Clarisse' })

  const aminata = await as('aminata@demo.devlink.africa')
  await aminata.goto('/cercles')
  const suggestion = trio(aminata).first()
  await expect(suggestion.getByText('Vous apprenez React à Kwame Boateng.')).toBeVisible()
  await expect(suggestion.getByText('Imani Wanjiru vous apprend Docker.')).toBeVisible()
  await suggestion.getByRole('button', { name: 'Proposer ce cercle' }).click()
  await expect(trio(aminata).getByText(/1 sur 3 ont accepté/)).toBeVisible()

  for (const email of ['kwame@demo.devlink.africa', 'imani@demo.devlink.africa']) {
    const member = await as(email)
    await expect(
      member.getByRole('link', { name: /^Cercles\s*\(1 invitation en attente\)$/ }),
    ).toBeVisible()
    await member.goto('/cercles')
    await trio(member).getByRole('button', { name: 'Accepter' }).click()
    await expect(trio(member).getByRole('button', { name: 'Accepter' })).toBeHidden()
  }

  await aminata.reload()
  await expect(trio(aminata).getByText(/Tout le monde a accepté/)).toBeVisible()
  await expect(trio(aminata).getByRole('link', { name: 'kwame@demo.devlink.africa' })).toBeVisible()
  await expect(trio(aminata).getByRole('link', { name: 'imani@demo.devlink.africa' })).toBeVisible()

  // Imani lui a appris Docker : Aminata le valide, et ça se voit sur le profil d'Imani.
  await trio(aminata).getByRole('button', { name: 'Valider Docker' }).click()
  await trio(aminata)
    .getByLabel(/Un mot sur ce qu'il ou elle vous a appris/)
    .fill('Limpide.')
  await trio(aminata).getByRole('button', { name: 'Confirmer la validation' }).click()
  await expect(trio(aminata).getByText('Validée')).toBeVisible()
  const imaniId = await aminata.evaluate(async () => {
    const response = await fetch('/api/v1/search/users/?q=Imani')
    return (await response.json()).results[0].id as number
  })
  await aminata.goto(`/developpeurs/${imaniId}`)
  const verified = aminata.getByRole('region', { name: 'Validé par ses pairs' })
  await expect(verified).toContainText('Docker')
  await expect(verified).toContainText('« Limpide. »')

  for (const page of sessions) await page.context().close()
})
