import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req }) => req.user?.collection === 'users'

export const isAdminField: FieldAccess = ({ req }) => req.user?.collection === 'users'

/** Читати можуть усі, але неопубліковане — лише адміністратори. */
export const publishedOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  return { status: { equals: 'published' } }
}

export const anyone: Access = () => true
