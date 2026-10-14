import { Link, type LinkProps } from 'react-router-dom'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

/**
 * Lien de navigation à l'apparence d'un bouton.
 *
 * Remplace `<Link><Button /></Link>` : un bouton dans un lien est du HTML
 * invalide et crée deux arrêts de tabulation pour une seule action.
 */
export default function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link {...rest} className={buttonClasses(variant, size, className)} />
}
