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
import { Upload, X, FileText, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Sparkles, Shield, Users, Rocket, ShieldAlert } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'
import { MultiSelect } from '@/components/ui/multi-select'
import { LocationInput } from '@/components/ui/location-input'
import { createInAppNotification, sendNotificationEmail, notifyAdmins } from '@/lib/notifications'
import { validateExpertiseAreas } from '@/lib/expertiseValidation'
import { formatAndValidatePhone } from '@/lib/phoneUtils'
import { profileNotificationService } from '@/lib/profileNotifications'

const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali',
  'Gujarati', 'Punjabi', 'Odia', 'Assamese', 'Urdu', 'Sanskrit', 'Konkani',
  'Maithili', 'Sindhi', 'Nepali', 'French', 'German', 'Spanish', 'Mandarin',
  'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Russian', 'Italian',
]

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
  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<ExpertOnboardingForm>({
    mode: 'onChange'
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [showStep1Errors, setShowStep1Errors] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [locationValue, setLocationValue] = useState('')
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const navigate = useNavigate()

  const watchedFullName = watch('full_name')
  const watchedEmail = watch('email')
  const watchedPhone = watch('phone')
  const watchedBio = watch('bio')

  const isStep1Valid = Boolean(
    watchedFullName &&
    watchedEmail &&
    watchedPhone &&
    watchedBio &&
    !errors.full_name &&
    !errors.email &&
    !errors.phone &&
    !errors.bio &&
    locationValue &&
    locationValue.trim().length > 0 &&
    selectedLanguages.length > 0
  )

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
      // Check speaker verification status
      const { data: speaker } = await supabase
        .from('speakers')
        .select('verification_status, suspension_reason')
        .eq('user_id', user.id)
        .maybeSingle()

      if (speaker && speaker.verification_status === 'suspended') {
        setIsSuspended(true)
        setSuspensionReason(speaker.suspension_reason || 'Suspended by admin')
        return
      }

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
          toast.error(`Failed to upload ${file.name}: ${getCleanErrorMessage(error)}`)
          continue
        }
        const { data: urlData } = supabase.storage.from('verification-documents').getPublicUrl(data.path)
        fileUrl = urlData.publicUrl

        setUploadedDocs(prev => [...prev, { name: file.name, url: fileUrl, type: file.type }])
      }
      toast.success('Documents added successfully')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error(`Document upload failed: ${getCleanErrorMessage(err)}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeDoc = (index: number) => setUploadedDocs(prev => prev.filter((_, i) => i !== index))

  const getCleanErrorMessage = (error: unknown): string => {
    if (!error) return "An unexpected error occurred.";
    let msg = "";
    let code = "";
    if (error instanceof Error) {
      msg = error.message;
      const errObj = error as unknown as Record<string, unknown>;
      if (typeof errObj.code === 'string') code = errObj.code;
    } else if (typeof error === 'object' && error !== null) {
      const errObj = error as Record<string, unknown>;
      if (typeof errObj.message === 'string') msg = errObj.message;
      if (typeof errObj.code === 'string') code = errObj.code;
    } else if (typeof error === 'string') {
      msg = error;
    }
    if (code === '40300' || msg.includes('Your profile is under review')) {
      return 'Your profile is under review. Editing is temporarily disabled until verification completes.';
    }
    if (code === '42501' || msg.includes('row-level security') || msg.includes('permission denied') || msg.includes('violates row-level security policy')) {
      return 'RLS blocked request: Storage or database policy denied access.';
    }
    if (code === '23505' || msg.includes('unique constraint') || msg.includes('duplicate key')) {
      return 'Duplicate profile: An expert profile already exists for this account.';
    }
    if (code === '23503' || msg.includes('foreign key constraint')) {
      return 'Database constraint failed: Referenced record was not found.';
    }
    if (code === '23514' || msg.includes('check constraint')) {
      if (msg.includes('profiles_user_type_check')) {
        return 'Database constraint failed: Invalid user type specified.';
      }
      return `Database check constraint failed: ${msg}`;
    }
    if (msg.includes('bucket') || msg.includes('Storage')) {
      return `Bucket upload failed: ${msg}`;
    }
    return msg || "Unexpected server response.";
  };

  const goToStep2 = async () => {
    setShowStep1Errors(true)
    const fieldsValid = await trigger(['full_name', 'email', 'phone', 'bio'])
    const locationValid = locationValue.trim().length > 0
    const languagesValid = selectedLanguages.length > 0
    if (!fieldsValid || !locationValid || !languagesValid) {
      toast.error('Please complete all required fields before continuing')
      return
    }
    setStep(2)
  }

  const goToStep3 = async () => {
    const fieldsValid = await trigger(['title', 'expertise_areas', 'experience_years'])
    if (!fieldsValid) {
      toast.error('Please complete all required fields before continuing')
      return
    }
    setStep(3)
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const onSubmit = async (data: ExpertOnboardingForm) => {
    const nameRegex = /^[\p{L}\s\-'.]+$/u;
    const invalidSymbolsRegex = /[<>={}[\]/\\^%$@#*]/;
    const numericOnlyRegex = /^[0-9\s\-_, .()]+$/;

    const nameTrimmed = data.full_name.trim()
    if (!nameTrimmed) { toast.error('Full Name is required'); return }
    if (!nameRegex.test(nameTrimmed)) { toast.error('Full Name contains invalid characters or symbols'); return }
    if (numericOnlyRegex.test(nameTrimmed)) { toast.error('Full Name cannot be numeric-only'); return }

    const emailTrimmed = data.email.trim()
    if (!emailTrimmed || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailTrimmed)) {
      toast.error('Please enter a valid email address')
      return
    }

    const phoneValidation = formatAndValidatePhone(data.phone)
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || 'Please enter a valid phone number')
      return
    }
    const phoneClean = phoneValidation.normalized

    const companyTrimmed = data.company?.trim()
    if (companyTrimmed) {
      if (numericOnlyRegex.test(companyTrimmed)) {
        toast.error('Company name cannot be numeric-only')
        return
      }
      if (invalidSymbolsRegex.test(companyTrimmed)) {
        toast.error('Company name contains invalid symbols')
        return
      }
    }

    const locTrimmed = locationValue.trim()
    if (!locTrimmed) { toast.error('Please enter your location'); return }
    if (numericOnlyRegex.test(locTrimmed) || locTrimmed.length < 2) {
      toast.error('Please enter a valid location/country')
      return
    }
    if (invalidSymbolsRegex.test(locTrimmed)) {
      toast.error('Location contains invalid symbols')
      return
    }

    const bioTrimmed = data.bio?.trim()
    if (!bioTrimmed) { toast.error('Bio is required'); return }
    if (numericOnlyRegex.test(bioTrimmed)) {
      toast.error('Bio cannot be numeric-only')
      return
    }
    if (invalidSymbolsRegex.test(bioTrimmed)) {
      toast.error('Bio contains invalid symbols')
      return
    }

    if (data.experience_years === undefined || data.experience_years === null || Number.isNaN(data.experience_years)) {
      toast.error('Years of experience is required')
      return
    }
    if (data.experience_years < 0 || !Number.isInteger(data.experience_years)) {
      toast.error('Years of experience must be a non-negative integer')
      return
    }

    const titleTrimmed = data.title.trim()
    if (!titleTrimmed) { toast.error('Professional title is required'); return }
    if (numericOnlyRegex.test(titleTrimmed)) {
      toast.error('Professional title cannot be numeric-only'); return
    }
    if (invalidSymbolsRegex.test(titleTrimmed)) {
      toast.error('Professional title contains invalid symbols'); return
    }

    const expertiseRes = validateExpertiseAreas(data.expertise_areas)
    if (!expertiseRes.isValid) {
      toast.error(expertiseRes.error || 'Please enter valid expertise names')
      return
    }
    const expertiseAreas = expertiseRes.sanitized

    if (selectedLanguages.length === 0) { toast.error('Select at least one language'); return }
    const invalidLangs = selectedLanguages.some(lang => numericOnlyRegex.test(lang) || lang.length < 2 || invalidSymbolsRegex.test(lang))
    if (invalidLangs) {
      toast.error('Please select valid languages')
      return
    }

    if (selectedCategories.length === 0) { toast.error('Select at least one category'); return }
    // Verification documents are optional. Uploading them lets an admin grant the
    // "Verified" badge; without them the expert still goes live once approved.
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { toast.error('Please log in'); navigate('/auth'); return }

      const languages = selectedLanguages
      const hasDocs = uploadedDocs.length > 0
      const verificationDocuments = hasDocs ? {
        documents: uploadedDocs.map(doc => ({ name: doc.name, url: doc.url, type: doc.type, uploaded_at: new Date().toISOString() })),
        submitted_at: new Date().toISOString()
      } : null

      // "Topics You Help With" was collected but never persisted.
      // NOTE: the sibling `preferred_audience` input is still dropped because
      // speakers has no such column yet; it needs a migration before it can be saved.
      const topics = (data.topics || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const speakerPayload = {
        user_id: user.id, name: data.full_name.trim(), title: data.title,
        bio: data.bio || '', expertise: expertiseAreas, topics: topics.length > 0 ? topics : null,
        experience_years: data.experience_years,
        hourly_rate: 0, currency: 'INR', location: locationValue || null,
        languages: languages.length > 0 ? languages : null,
        verification_status: 'pending', is_verified: false, company: data.company || null,
        phone: phoneClean, email: data.email || user.email,
        linkedin_url: data.linkedin_url || null, website_url: data.website_url || null,
        verification_documents: verificationDocuments,
      }

      const { data: existingExpert, error: existingExpertError } = await supabase
        .from('speakers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingExpertError) throw existingExpertError

      const expertWrite = existingExpert
        ? await supabase
            .from('speakers')
            .update(speakerPayload)
            .eq('id', existingExpert.id)
            .select()
            .single()
        : await supabase
            .from('speakers')
            .insert(speakerPayload)
            .select()
            .single()

      const { data: expertData, error: expertError } = expertWrite

      if (expertError) throw expertError

      if (expertData && selectedCategories.length > 0) {
        await supabase.from('speaker_categories').delete().eq('speaker_id', expertData.id)
        await supabase.from('speaker_categories').insert(
          selectedCategories.map(catId => ({ speaker_id: expertData.id, category_id: catId }))
        )
      }
      // Only open a verification request when the expert actually uploaded
      // documents. Admins review these documents to grant the Verified badge.
      if (expertData && hasDocs) {
        const verificationPayload = {
          speaker_id: expertData.id, status: 'pending', submitted_at: new Date().toISOString(),
          documents: verificationDocuments, notes: `${uploadedDocs.length} document(s) uploaded.`
        }
        const { data: existingRequest } = await supabase
          .from('verification_requests')
          .select('id')
          .eq('speaker_id', expertData.id)
          .maybeSingle()

        if (existingRequest) {
          await supabase
            .from('verification_requests')
            .update(verificationPayload)
            .eq('id', existingRequest.id)
        } else {
          await supabase.from('verification_requests').insert(verificationPayload)
        }
      }
      await supabase.from('profiles').upsert({
        id: user.id, full_name: data.full_name.trim(), email: user.email,
        user_type: 'expert', bio: data.bio || '', phone: data.phone || null,
      })

      // Send notifications for expert application submission (email, user confirmation, admin alert)
      if (user.email) {
        await sendNotificationEmail({
          to: user.email,
          subject: "Your Irookee expert application has been received",
          eventType: "email_expert_application",
          html: `<p>Dear ${data.full_name.trim()},</p><p>Thank you for applying to become an expert on Irookee! We have received your application and it is currently pending review.</p>`,
          userId: user.id
        }).catch(err => console.error("Failed to send notification email:", err))
      }

      await createInAppNotification({
        userId: user.id,
        title: "Expert application submitted",
        body: "Your application to become an expert has been received and is pending admin review.",
        type: "expert_application"
      }).catch(err => console.error("Failed to create in-app notification:", err))

      if (expertData) {
        // Notify admins
        await notifyAdmins({
          title: "New Expert Application",
          body: `${data.full_name.trim()} (${data.title}) has submitted a new expert application.`,
          type: "expert_application",
          relatedId: expertData.id
        }).catch(err => console.error("Failed to notify admins:", err))
      }

      toast.success(
        hasDocs
          ? 'Profile submitted! Your documents are under review for the Verified badge.'
          : 'Profile submitted! You can add verification documents anytime to earn the Verified badge.'
      )
      navigate('/expert/dashboard')
    } catch (error) {
      console.error('Error:', error)
      toast.error(getCleanErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 4
  const StepIcon = STEP_INFO[step - 1].icon

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 container mx-auto px-4 max-w-xl pt-32 pb-12 flex flex-col justify-center">
          <Card className="border-orange-200 bg-orange-50/50">
            <div className="p-6 md:p-8 space-y-4">
              <div className="text-center">
                <ShieldAlert className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-orange-800">Account Suspended</h2>
                <p className="text-orange-700 mt-1">
                  Your expert onboarding is blocked because your account has been suspended by an administrator.
                </p>
              </div>
              <div className="p-3 bg-white border border-orange-200 rounded text-sm space-y-1">
                <p><strong>Reason:</strong> {suspensionReason || 'No details provided.'}</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                If you believe this is a mistake, please contact platform support.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Return to Homepage
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col">
      <Navigation />
      <div className="mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-12 flex-1">

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
            <span className="text-muted-foreground"> -  {STEP_INFO[step - 1].subtitle}</span>
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
                    <Input 
                      {...register('full_name', { 
                        required: 'Full name is required',
                        pattern: {
                          value: /^[A-Za-z][A-Za-z\s'-]{1,60}$/,
                          message: 'Full name must contain only letters, spaces, hyphens, or apostrophes, start with a letter, and be 2-60 characters.'
                        }
                      })} 
                      placeholder="Priya Sharma" 
                      className="mt-1" 
                    />
                    {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      {...register('email', {
                        required: 'Required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="mt-1"
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      {...register('phone', {
                        required: 'Phone number is required',
                        validate: {
                          validPhone: value => {
                            const res = formatAndValidatePhone(value);
                            return res.isValid || res.error || 'Please enter a valid phone number';
                          }
                        }
                      })}
                      placeholder="+91 99668 27110 or 9966827110"
                      className="mt-1"
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <Label>Location *</Label>
                    <LocationInput value={locationValue} onChange={(v) => { setLocationValue(v); setValue('location', v); }} className="mt-1" />
                    {showStep1Errors && !locationValue.trim() && <p className="text-sm text-destructive mt-1">Please enter your location</p>}
                  </div>
                  <div>
                    <Label>Company / Organization</Label>
                    <Input {...register('company')} placeholder="Your company" className="mt-1" />
                  </div>
                  <div>
                    <Label>Languages *</Label>
                    <div className="mt-1">
                      <MultiSelect
                        options={LANGUAGE_OPTIONS}
                        selected={selectedLanguages}
                        onChange={(langs) => { setSelectedLanguages(langs); setValue('languages', langs.join(', ')); }}
                        placeholder="Select languages..."
                      />
                    </div>
                    {showStep1Errors && selectedLanguages.length === 0 && (
                      <p className="text-sm text-destructive mt-1">Select at least one language</p>
                    )}
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
                  <Button type="button" onClick={goToStep2} size="lg" disabled={!isStep1Valid}>
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
                  <Input 
                    {...register('title', { 
                      required: 'Professional title is required',
                      validate: {
                        notNumeric: value => !/^[0-9\s\-_, .()]+$/.test(value) || 'Professional title cannot be numeric-only',
                        noSymbols: value => !/[<>={}[\]/\\^%$@#*]/.test(value) || 'Professional title contains invalid symbols'
                      }
                    })} 
                    placeholder="Startup Mentor, Travel Guide, Financial Advisor..." 
                    className="mt-1" 
                  />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <Label>Expertise Areas (comma-separated) *</Label>
                  <Input 
                    {...register('expertise_areas', { 
                      required: 'Expertise areas are required',
                      validate: {
                        validExpertise: value => {
                          const res = validateExpertiseAreas(value);
                          return res.isValid || res.error || 'Please enter valid expertise names';
                        }
                      }
                    })} 
                    placeholder="Software Engineering, AI, Machine Learning, UI/UX Design" 
                    className="mt-1" 
                  />
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
                  <Button type="button" onClick={goToStep3} size="lg">
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
                <p className="text-muted-foreground">Pick all that apply  -  this helps people find you.</p>
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
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Get the Verified badge <span className="font-normal">(optional)</span>
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Uploading proof documents lets our team review and grant you a
                        <span className="font-medium"> Verified ✓ </span>
                        badge  -  it builds trust and helps you get booked. You can skip this
                        and still go live; add documents anytime later.
                      </p>
                      <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-0.5">
                        <li>Government ID (Aadhar, PAN, Passport)</li>
                        <li>Professional certificate or degree</li>
                        <li>Work experience proof</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <label className="block border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-1">Click to upload or drag files</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG  -  up to 10MB each</p>
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
                    {loading
                      ? 'Submitting...'
                      : uploadedDocs.length > 0
                        ? 'Submit for Verification'
                        : 'Submit & Skip for Now'}
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
      <Footer />
    </div>
  )
}
