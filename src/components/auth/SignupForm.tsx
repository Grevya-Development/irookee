import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getSiteUrl } from '@/lib/siteUrl'
import { validateEmailInput } from '@/lib/emailValidation'
import { toast } from 'sonner'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export function SignupForm() {
  const { register, handleSubmit, formState: { errors }, watch, setError } = useForm<SignupFormData>()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const password = watch('password')

  const onSubmit = async (data: SignupFormData) => {
    const emailValidation = validateEmailInput(data.email)
    if (emailValidation.error) {
      setError('email', { type: 'validate', message: emailValidation.error })
      toast.error(emailValidation.error)
      return
    }

    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: emailValidation.email,
        password: data.password,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
          data: {
            full_name: data.fullName
          }
        },
      })

      if (signUpError) throw signUpError

      toast.success('Account created! Please check your email to verify your account.')
      navigate('/auth')
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Failed to create account'
      const errorMessage = rawMessage.toLowerCase().includes('rate limit') || rawMessage.toLowerCase().includes('too many requests')
        ? 'Too many signup emails have been requested. Please wait a few minutes before trying again.'
        : rawMessage
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              {...register('fullName', { required: 'Full name is required' })}
              className="mt-1"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { 
                required: 'Please enter your email address.',
                setValueAs: (value) => String(value || '').trim(),
                validate: (value) => validateEmailInput(value).error || true,
              })}
              className="mt-1"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            <UserPlus className="mr-2 h-4 w-4" />
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

