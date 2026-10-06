import { Link } from 'react-router-dom'
import { Button, EmptyState } from '../components/ui'

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page introuvable"
      description="Cette page n'existe pas ou a été déplacée."
      action={
        <Link to="/">
          <Button>Retour à l'accueil</Button>
        </Link>
      }
    />
  )
}
