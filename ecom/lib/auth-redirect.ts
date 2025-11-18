import type { PersistedUser, UserRole } from './users'

const ROLES_REQUIRING_ORG: UserRole[] = ['DONOR', 'RECIPIENT']

export function requiresOrganizationCompletion(user?: PersistedUser | null) {
  if (!user) return true
  return ROLES_REQUIRING_ORG.includes(user.role) && !user.organizationId
}

export function getPostAuthRedirect(user?: PersistedUser | null) {
  if (!user) return '/login'
  if (!user.role) return '/onboarding/role'
  if (requiresOrganizationCompletion(user)) {
    return '/onboarding/organization'
  }

  if (user.role === 'ADMIN') {
    return '/admin'
  }

  if (user.role === 'VOLUNTEER') {
    return '/volunteer'
  }

  return '/dashboard'
}
