const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

export function validateEmailInput(value: string) {
  const email = value.trim()

  if (!email) {
    return { email, error: 'Please enter your email address.' }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { email, error: 'Please enter a valid email address.' }
  }

  return { email, error: null }
}
