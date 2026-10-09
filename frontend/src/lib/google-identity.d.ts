/**
 * Déclarations minimales pour Google Identity Services (bouton « Continuer
 * avec Google »). On ne déclare que ce qu'on utilise réellement : pas de
 * paquet `@types` tiers pour quelques appels.
 */

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdConfiguration {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
}

interface GoogleButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize(config: GoogleIdConfiguration): void
        renderButton(parent: HTMLElement, options: GoogleButtonOptions): void
        cancel(): void
      }
    }
  }
}
