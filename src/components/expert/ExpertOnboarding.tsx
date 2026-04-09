import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ExpertOnboardingForm {
  full_name: string
  title: string
  expertise_areas: string
  experience_years: number
  hourly_rate: number
  location: string
  languages: string
  bio?: string
}

export function ExpertOnboarding() {
  const { register, handleSubmit, formState: { errors } } = useForm<ExpertOnboardingForm>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (data: ExpertOnboardingForm) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in to become an expert')
        navigate('/auth')
        return
      }

      // Parse expertise areas and languages
      const expertiseAreas = data.expertise_areas
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      
      const languages = data.languages
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

          const { error: expertError } = await supabase
            .from('speakers')
            .upsert({
              user_id: user.id,
              full_name: data.full_name.trim(),
              title: data.title,
              bio: data.bio || '',
              expertise_areas: expertiseAreas,
              experience_years: data.experience_years,
              hourly_rate: Math.round(data.hourly_rate),
              location: data.location || null,
              languages: languages.length > 0 ? languages : null,
              verification_status: 'pending'
            },{
              onConflict: 'user_id'
            });

      if (expertError) throw expertError

      // Update user type

        const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_type: 'expert',
          bio: data.bio || ''
        });

      if (profileError) throw profileError;
      // const { error: profileError } = await supabase
      //   .from('profiles')
      //   .update({ user_type: 'expert' })
      //   .eq('id', user.id)

      // if (profileError) throw profileError

      // // Update bio if provided
      // if (data.bio) {
      //   await supabase
      //     .from('profiles')
      //     .update({ bio: data.bio })
      //     .eq('id', user.id)
      // }

      toast.success('Expert profile created! It will be reviewed before going live.')
      navigate('/expert/dashboard')
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create expert profile'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Become an Expert on Irookee</CardTitle>
          <CardDescription>
            Share your expertise and help others while earning money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                {...register('full_name', { required: 'Name is required' })}
                placeholder="e.g., John Doe"
                className="mt-1"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="title">Professional Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g., Startup Mentor, Travel Guide, Business Consultant"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="expertise_areas">Expertise Areas (comma-separated) *</Label>
              <Input
                id="expertise_areas"
                {...register('expertise_areas', { required: 'Expertise areas are required' })}
                placeholder="Startups, Fundraising, Product Management"
                className="mt-1"
              />
              {errors.expertise_areas && (
                <p className="text-sm text-destructive mt-1">{errors.expertise_areas.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_years">Years of Experience *</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  {...register('experience_years', { 
                    required: 'Experience years are required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Must be 0 or greater' }
                  })}
                  className="mt-1"
                />
                {errors.experience_years && (
                  <p className="text-sm text-destructive mt-1">{errors.experience_years.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate ($) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('hourly_rate', { 
                    required: 'Hourly rate is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Must be 0 or greater' }
                  })}
                  className="mt-1"
                />
                {errors.hourly_rate && (
                  <p className="text-sm text-destructive mt-1">{errors.hourly_rate.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="San Francisco, CA"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="languages">Languages (comma-separated) *</Label>
              <Input
                id="languages"
                {...register('languages', { required: 'Languages are required' })}
                placeholder="English, Spanish, French"
                className="mt-1"
              />
              {errors.languages && (
                <p className="text-sm text-destructive mt-1">{errors.languages.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="Tell us about your background and expertise..."
                className="mt-1"
                rows={4}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Creating Profile...' : 'Complete Onboarding'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

