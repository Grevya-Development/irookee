import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Upload, X, FileText, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Sparkles, Shield, Users, Rocket } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface ExpertOnboardingForm {
  full_name: string
  title: string
  email: string
  phone: string
  company: string
  expertise_areas: string
  experience_years: number
  location: string
  languages: string
  bio: string
  linkedin_url: string
  website_url: string
  topics: string
  preferred_audience: string
}

interface UploadedDoc {
  name: string
  url: string
  type: string
}

const STEP_INFO = [
  { title: 'About You', subtitle: 'Let us know who you are', icon: Users },
  { title: 'Your Expertise', subtitle: 'Tell us what you are great at', icon: Sparkles },
  { title: 'Categories', subtitle: 'Where do you fit in?', icon: Rocket },
  { title: 'Verification', subtitle: 'Build trust with proof', icon: Shield },
]

export function ExpertOnboarding() {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ExpertOnboardingForm>()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCategories()
    prefillUserData()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name')
    if (data) setCategories(data)
  }

  const prefillUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
    if (user) {
      setValue('email', user.email || '')
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (profile) {
        if (profile.full_name) setValue('full_name', profile.full_name)
        if (profile.phone) setValue('phone', profile.phone)
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        toast.error('Please sign in first to upload documents')
        navigate('/auth?redirect=/expert/onboarding')
        return
      }

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`)
          continue
        }

        let fileUrl = ''
        const fileName = `${user.id}/${Date.now()}_${file.name}`
        const { data, error } = await supabase.storage.from('verification-documents').upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })
        if (error) {
          console.error('Storage upload error:', error.message)
          toast.error(`Failed to upload ${file.name}: ${error.message}`)
          continue
        }
        const { data: urlData } = supabase.storage.from('verification-documents').getPublicUrl(data.path)
        fileUrl = urlData.publicUrl

        setUploadedDocs(prev => [...prev, { name: file.name, url: fileUrl, type: file.type }])
      }
      toast.success('Documents added successfully')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Please try again')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeDoc = (index: number) => setUploadedDocs(prev => prev.filter((_, i) => i !== index))

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const onSubmit = async (data: ExpertOnboardingForm) => {
    if (selectedCategories.length === 0) { toast.error('Select at least one category'); return }
    if (uploadedDocs.length === 0) { toast.error('Upload at least one verification document'); return }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { toast.error('Please log in'); navigate('/auth'); return }

      const expertiseAreas = data.expertise_areas.split(',').map(s => s.trim()).filter(Boolean)
      const languages = data.languages.split(',').map(s => s.trim()).filter(Boolean)
      const topics = data.topics ? data.topics.split(',').map(s => s.trim()).filter(Boolean) : []
      const preferredAudience = data.preferred_audience ? data.preferred_audience.split(',').map(s => s.trim()).filter(Boolean) : []
      const verificationDocuments = {
        documents: uploadedDocs.map(doc => ({ name: doc.name, url: doc.url, type: doc.type, uploaded_at: new Date().toISOString() })),
        submitted_at: new Date().toISOString()
      }

      const { data: expertData, error: expertError } = await supabase
        .from('speakers')
        .upsert({
          user_id: user.id, name: data.full_name.trim(), title: data.title,
          bio: data.bio || '', expertise: expertiseAreas, experience_years: data.experience_years,
          hourly_rate: 0, currency: 'INR', location: data.location || null,
          languages: languages.length > 0 ? languages : null,
          verification_status: 'pending', is_verified: false, company: data.company || null,
          phone: data.phone || null, email: data.email || user.email,
          linkedin_url: data.linkedin_url || null, website_url: data.website_url || null,
          verification_documents: verificationDocuments,
        }, { onConflict: 'user_id' }).select().single()

      if (expertError) throw expertError

      if (expertData && selectedCategories.length > 0) {
        await supabase.from('speaker_categories').delete().eq('speaker_id', expertData.id)
        await supabase.from('speaker_categories').insert(
          selectedCategories.map(catId => ({ speaker_id: expertData.id, category_id: catId }))
        )
      }
      if (expertData) {
        await supabase.from('verification_requests').upsert({
          speaker_id: expertData.id, status: 'pending', submitted_at: new Date().toISOString(),
          documents: verificationDocuments, notes: `${uploadedDocs.length} document(s) uploaded.`
        }, { onConflict: 'speaker_id' })
      }
      await supabase.from('profiles').upsert({
        id: user.id, full_name: data.full_name.trim(), email: user.email,
        user_type: 'expert', bio: data.bio || '', phone: data.phone || null,
      })

      toast.success('Profile submitted for verification!')
      navigate('/expert/dashboard')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 4
  const StepIcon = STEP_INFO[step - 1].icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <Navigation />
      <div className="mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-12">

        {/* Welcome header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome to irookee
          </h1>
          <p className="text-lg text-muted-foreground">
            Join our community of experts and help people around the world.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEP_INFO.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step > i + 1 ? 'bg-green-500 text-white' :
                  step === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step > i + 1 ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-full h-1 mx-2 rounded ${step > i + 1 ? 'bg-green-500' : 'bg-muted'}`} style={{ minWidth: '2rem' }} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-center">
            <StepIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold">{STEP_INFO[step - 1].title}</span>
            <span className="text-muted-foreground">— {STEP_INFO[step - 1].subtitle}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input {...register('full_name', { required: 'Required' })} placeholder="Priya Sharma" className="mt-1" />
                    {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" {...register('email', { required: 'Required' })} className="mt-1" />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input {...register('phone', { required: 'Required' })} placeholder="+91 98765 43210" className="mt-1" />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <Label>Location *</Label>
                    <Input {...register('location', { required: 'Required' })} placeholder="Bangalore, India" className="mt-1" />
                    {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
                  </div>
                  <div>
                    <Label>Company / Organization</Label>
                    <Input {...register('company')} placeholder="Your company" className="mt-1" />
                  </div>
                  <div>
                    <Label>Languages (comma-separated) *</Label>
                    <Input {...register('languages', { required: 'Required' })} placeholder="English, Hindi, Tamil" className="mt-1" />
                    {errors.languages && <p className="text-sm text-destructive mt-1">{errors.languages.message}</p>}
                  </div>
                </div>
                <div>
                  <Label>Tell us about yourself *</Label>
                  <Textarea {...register('bio', { required: 'Required', minLength: { value: 50, message: 'At least 50 characters' } })}
                    placeholder="Share your journey, what drives you, and how you help people..."
                    rows={4} className="mt-1" />
                  {errors.bio && <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>}
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={() => setStep(2)} size="lg">
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Professional Details */}
          {step === 2 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div>
                  <Label>Professional Title *</Label>
                  <Input {...register('title', { required: 'Required' })} placeholder="Startup Mentor, Travel Guide, Financial Advisor..." className="mt-1" />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <Label>Expertise Areas (comma-separated) *</Label>
                  <Input {...register('expertise_areas', { required: 'Required' })} placeholder="Startups, Fundraising, Product Management" className="mt-1" />
                  {errors.expertise_areas && <p className="text-sm text-destructive mt-1">{errors.expertise_areas.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Years of Experience *</Label>
                    <Input type="number" min="0" {...register('experience_years', { required: 'Required', valueAsNumber: true, min: { value: 0, message: 'Min 0' } })} className="mt-1" />
                    {errors.experience_years && <p className="text-sm text-destructive mt-1">{errors.experience_years.message}</p>}
                  </div>
                  <div>
                    <Label>Topics You Help With</Label>
                    <Input {...register('topics')} placeholder="Pitch Decks, Market Research, SEO" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Who do you want to help?</Label>
                  <Input {...register('preferred_audience')} placeholder="Students, Founders, Working Professionals" className="mt-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>LinkedIn URL</Label>
                    <Input {...register('linkedin_url')} placeholder="https://linkedin.com/in/..." className="mt-1" />
                  </div>
                  <div>
                    <Label>Website / Portfolio</Label>
                    <Input {...register('website_url')} placeholder="https://..." className="mt-1" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button type="button" onClick={() => setStep(3)} size="lg">
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Categories */}
          {step === 3 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-8 space-y-5">
                <p className="text-muted-foreground">Pick all that apply — this helps people find you.</p>
                <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
                  {categories.map(cat => (
                    <button
                      key={cat.id} type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selectedCategories.includes(cat.id)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background border-border hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {selectedCategories.includes(cat.id) && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                      {cat.name}
                    </button>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <p className="text-sm text-muted-foreground">{selectedCategories.length} selected</p>
                )}
                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button type="button" onClick={() => {
                    if (selectedCategories.length === 0) { toast.error('Select at least one'); return }
                    setStep(4)
                  }} size="lg">
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Document Verification */}
          {step === 4 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">Upload proof documents</p>
                      <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-0.5">
                        <li>Government ID (Aadhar, PAN, Passport)</li>
                        <li>Professional certificate or degree</li>
                        <li>Work experience proof (optional)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <label className="block border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-1">Click to upload or drag files</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG — up to 10MB each</p>
                  <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                </label>

                {uploadedDocs.length > 0 && (
                  <div className="space-y-2">
                    {uploadedDocs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                        <button type="button" onClick={() => removeDoc(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                  <strong>100% Free.</strong> irookee is free for all experts. Once verified, people can discover and book sessions with you at no cost.
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" disabled={loading} size="lg">
                    {loading ? 'Submitting...' : 'Submit for Verification'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Document Verified</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> 20+ Experts Onboarded</span>
          <span className="flex items-center gap-1"><Sparkles className="h-4 w-4" /> AI-Powered Matching</span>
        </div>
      </div>
    </div>
  )
}
