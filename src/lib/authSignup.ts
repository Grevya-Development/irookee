import type { AuthResponse } from '@supabase/supabase-js'

export const assertSignupCreatedNewIdentity = ({ data, error }: AuthResponse) => {
  if (error) throw error

  const identities = data.user?.identities
  if (Array.isArray(identities) && identities.length === 0) {
    throw new Error('An account already exists for this email. Please log in instead.')
  }
}
