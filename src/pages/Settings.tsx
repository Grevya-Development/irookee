import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { isCurrentUserAdmin } from '@/lib/auth'
import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, Save, Trash2, Loader2, AlertTriangle, User, Shield, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProfileData {
  full_name: string
  email: string
  phone: string
  bio: string
  avatar_url: string
}

interface ExpertData {
  id: string
  name: string
  title: string
  bio: string
  location: string
  company: string
  phone: string
  email: string
  linkedin_url: string
  website_url: string
  expertise: string[]
  languages: string[]
  experience_years: number | null
  verification_status: string
  image_url: string | null
}

type NotificationPreferences = {
  email_booking_confirmed: boolean
  email_expert_application: boolean
  email_expert_approved: boolean
  in_app_notifications: boolean
}

const defaultNotificationPreferences: NotificationPreferences = {
  email_booking_confirmed: true,
  email_expert_application: true,
  email_expert_approved: true,
  in_app_notifications: true,
}

export default function Settings() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '', email: '', phone: '', bio: '', avatar_url: ''
  })
  const [expertData, setExpertData] = useState<ExpertData | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [isExpert, setIsExpert] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isCurrentUserAdmin()
      setIsAdmin(adminStatus)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    } else if (user) {
      loadProfile()
      loadExpertProfile()
      loadNotificationPreferences()
      checkAdminStatus()
    }
  }, [user, authLoading])

  const loadProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (data) {
      setProfileData({
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
      })
    } else {
      setProfileData(prev => ({ ...prev, email: user.email || '' }))
    }
  }

  const loadExpertProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('speakers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data) {
      setIsExpert(true)
      setExpertData({
        id: data.id,
        name: data.name || '',
        title: data.title || '',
        bio: data.bio || '',
        location: data.location || '',
        company: data.company || '',
        phone: data.phone || '',
        email: data.email || '',
        linkedin_url: data.linkedin_url || '',
        website_url: data.website_url || '',
        expertise: data.expertise || [],
        languages: data.languages || [],
        experience_years: data.experience_years,
        verification_status: data.verification_status || 'pending',
        image_url: data.image_url || data.profile_photo_url || null,
      })
    }
  }

  const loadNotificationPreferences = async () => {
    if (!user) return

    const { data } = await supabase
      .from('notification_preferences' as never)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data) {
      const prefs = data as NotificationPreferences
      setNotificationPreferences({
        email_booking_confirmed: Boolean(prefs.email_booking_confirmed),
        email_expert_application: Boolean(prefs.email_expert_application),
        email_expert_approved: Boolean(prefs.email_expert_approved),
        in_app_notifications: Boolean(prefs.in_app_notifications),
      })
    }
  }

  const saveNotificationPreferences = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('notification_preferences' as never)
        .upsert({
          user_id: user.id,
          ...notificationPreferences,
        } as never)

      if (error) throw error
      toast({ title: "Notification Preferences Saved", description: "Your notification settings have been updated" })
    } catch (error) {
      console.error('Notification preference save error:', error)
      toast({ title: "Save Failed", description: "Could not save notification preferences", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatars/profile_${Date.now()}.${fileExt}`

      // Try uploading to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        // If bucket doesn't exist, use a data URL fallback
        const reader = new FileReader()
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string
          setProfileData(prev => ({ ...prev, avatar_url: dataUrl }))
          // Save to profile
          await supabase.from('profiles').upsert({
            id: user.id,
            avatar_url: dataUrl,
          })
          if (isExpert && expertData) {
            await supabase.from('speakers').update({ image_url: dataUrl, profile_photo_url: dataUrl }).eq('id', expertData.id)
            setExpertData(prev => prev ? { ...prev, image_url: dataUrl } : prev)
          }
          toast({ title: "Photo Updated", description: "Profile photo saved" })
        }
        reader.readAsDataURL(file)
        return
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`
      setProfileData(prev => ({ ...prev, avatar_url: cacheBustedUrl }))

      await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl })
      if (isExpert && expertData) {
        await supabase.from('speakers').update({ image_url: publicUrl, profile_photo_url: publicUrl }).eq('id', expertData.id)
        setExpertData(prev => prev ? { ...prev, image_url: cacheBustedUrl } : prev)
      }

      toast({ title: "Photo Updated", description: "Profile photo uploaded" })
    } catch (error) {
      console.error('Upload error:', error)
      toast({ title: "Upload Failed", description: "Could not upload photo", variant: "destructive" })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const nameRegex = /^[\p{L}\s\-'.]+$/u;
  const invalidSymbolsRegex = /[<>={}[\]/\\^%$@#*]/;
  const numericOnlyRegex = /^[0-9\s\-_, .()]+$/;

  const saveProfile = async () => {
    if (!user) return

    const nameTrimmed = profileData.full_name.trim()
    if (!nameTrimmed) {
      toast({ title: "Validation Error", description: "Full Name is required", variant: "destructive" })
      return
    }
    if (!nameRegex.test(nameTrimmed)) {
      toast({ title: "Validation Error", description: "Full Name contains invalid characters or symbols", variant: "destructive" })
      return
    }
    if (numericOnlyRegex.test(nameTrimmed)) {
      toast({ title: "Validation Error", description: "Full Name cannot be numeric-only", variant: "destructive" })
      return
    }

    const emailTrimmed = profileData.email.trim()
    if (!emailTrimmed || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailTrimmed)) {
      toast({ title: "Validation Error", description: "Please enter a valid email address", variant: "destructive" })
      return
    }

    const phoneTrimmed = profileData.phone.trim()
    if (phoneTrimmed) {
      const phoneClean = phoneTrimmed.replace(/[\s()-]/g, '')
      if (!/^\+?[1-9]\d{9,14}$/.test(phoneClean)) {
        toast({ title: "Validation Error", description: "Please enter a valid phone number", variant: "destructive" })
        return
      }
    }

    const bioTrimmed = profileData.bio ? profileData.bio.trim() : ""
    if (bioTrimmed) {
      if (numericOnlyRegex.test(bioTrimmed)) {
        toast({ title: "Validation Error", description: "Bio cannot be numeric-only", variant: "destructive" })
        return
      }
      if (invalidSymbolsRegex.test(bioTrimmed)) {
        toast({ title: "Validation Error", description: "Bio contains invalid symbols", variant: "destructive" })
        return
      }
    }

    setSaving(true)
    try {
      const cleanAvatarUrl = profileData.avatar_url ? profileData.avatar_url.split('?')[0] : null
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: nameTrimmed,
        email: emailTrimmed,
        phone: phoneTrimmed || null,
        bio: bioTrimmed || null,
        avatar_url: cleanAvatarUrl,
      })
      if (error) throw error
      toast({ title: "Profile Saved", description: "Your personal information has been updated" })
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: "Save Failed", description: "Could not save profile", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const saveExpertProfile = async () => {
    if (!user || !expertData) return

    const nameTrimmed = expertData.name.trim()
    if (!nameTrimmed) {
      toast({ title: "Validation Error", description: "Display Name is required", variant: "destructive" })
      return
    }
    if (!nameRegex.test(nameTrimmed)) {
      toast({ title: "Validation Error", description: "Display Name contains invalid characters or symbols", variant: "destructive" })
      return
    }
    if (numericOnlyRegex.test(nameTrimmed)) {
      toast({ title: "Validation Error", description: "Display Name cannot be numeric-only", variant: "destructive" })
      return
    }

    const titleTrimmed = expertData.title.trim()
    if (!titleTrimmed) {
      toast({ title: "Validation Error", description: "Professional Title is required", variant: "destructive" })
      return
    }
    if (numericOnlyRegex.test(titleTrimmed)) {
      toast({ title: "Validation Error", description: "Professional Title cannot be numeric-only", variant: "destructive" })
      return
    }
    if (invalidSymbolsRegex.test(titleTrimmed)) {
      toast({ title: "Validation Error", description: "Professional Title contains invalid symbols", variant: "destructive" })
      return
    }

    const emailTrimmed = expertData.email.trim()
    if (!emailTrimmed || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailTrimmed)) {
      toast({ title: "Validation Error", description: "Please enter a valid email address", variant: "destructive" })
      return
    }

    const phoneTrimmed = expertData.phone.trim()
    if (!phoneTrimmed) {
      toast({ title: "Validation Error", description: "Phone number is required", variant: "destructive" })
      return
    }
    const phoneClean = phoneTrimmed.replace(/[\s()-]/g, '')
    if (!/^\+?[1-9]\d{9,14}$/.test(phoneClean)) {
      toast({ title: "Validation Error", description: "Please enter a valid phone number", variant: "destructive" })
      return
    }

    const companyTrimmed = expertData.company.trim()
    if (companyTrimmed) {
      if (numericOnlyRegex.test(companyTrimmed)) {
        toast({ title: "Validation Error", description: "Company name cannot be numeric-only", variant: "destructive" })
        return
      }
      if (invalidSymbolsRegex.test(companyTrimmed)) {
        toast({ title: "Validation Error", description: "Company name contains invalid symbols", variant: "destructive" })
        return
      }
    }

    const locationTrimmed = expertData.location.trim()
    if (!locationTrimmed) {
      toast({ title: "Validation Error", description: "Location is required", variant: "destructive" })
      return
    }
    if (numericOnlyRegex.test(locationTrimmed) || locationTrimmed.length < 2) {
      toast({ title: "Validation Error", description: "Please enter a valid location/country", variant: "destructive" })
      return
    }
    if (invalidSymbolsRegex.test(locationTrimmed)) {
      toast({ title: "Validation Error", description: "Location contains invalid symbols", variant: "destructive" })
      return
    }

    const bioTrimmed = expertData.bio ? expertData.bio.trim() : ""
    if (!bioTrimmed) {
      toast({ title: "Validation Error", description: "Bio is required", variant: "destructive" })
      return
    }
    if (numericOnlyRegex.test(bioTrimmed)) {
      toast({ title: "Validation Error", description: "Bio cannot be numeric-only", variant: "destructive" })
      return
    }
    if (invalidSymbolsRegex.test(bioTrimmed)) {
      toast({ title: "Validation Error", description: "Bio contains invalid symbols", variant: "destructive" })
      return
    }

    if (expertData.experience_years === null || expertData.experience_years === undefined || Number.isNaN(expertData.experience_years)) {
      toast({ title: "Validation Error", description: "Experience years is required and must be a valid number", variant: "destructive" })
      return
    }
    if (expertData.experience_years < 0 || !Number.isInteger(expertData.experience_years)) {
      toast({ title: "Validation Error", description: "Years of experience must be a non-negative integer", variant: "destructive" })
      return
    }

    if (!expertData.languages || expertData.languages.length === 0) {
      toast({ title: "Validation Error", description: "Please specify at least one language", variant: "destructive" })
      return
    }
    const invalidLangs = expertData.languages.some(lang => numericOnlyRegex.test(lang) || lang.length < 2 || invalidSymbolsRegex.test(lang))
    if (invalidLangs) {
      toast({ title: "Validation Error", description: "Please enter valid language names", variant: "destructive" })
      return
    }

    if (!expertData.expertise || expertData.expertise.length === 0) {
      toast({ title: "Validation Error", description: "Please specify at least one expertise area", variant: "destructive" })
      return
    }
    const invalidExpertise = expertData.expertise.some(exp => numericOnlyRegex.test(exp) || exp.length < 2 || invalidSymbolsRegex.test(exp))
    if (invalidExpertise) {
      toast({ title: "Validation Error", description: "Please enter valid expertise names", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('speakers').update({
        name: nameTrimmed,
        title: titleTrimmed,
        bio: bioTrimmed,
        location: locationTrimmed,
        company: companyTrimmed || null,
        phone: phoneTrimmed,
        email: emailTrimmed,
        linkedin_url: expertData.linkedin_url ? expertData.linkedin_url.trim() : null,
        website_url: expertData.website_url ? expertData.website_url.trim() : null,
        expertise: expertData.expertise,
        topics: expertData.expertise,
        languages: expertData.languages,
        experience_years: expertData.experience_years,
      }).eq('id', expertData.id)

      if (error) throw error
      toast({ title: "Expert Profile Saved", description: "Your expert profile has been updated" })
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: "Save Failed", description: "Could not save expert profile", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) throw error

      await supabase.auth.signOut()

      toast({ title: "Account Deleted", description: "Your account and profile data have been removed" })
      navigate('/')
    } catch (error) {
      console.error('Delete error:', error)
      toast({ title: "Delete Failed", description: "Could not delete account. Contact support.", variant: "destructive" })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 max-w-5xl flex-1">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-6">Manage your profile, expert details, and account</p>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-1" /> Profile</TabsTrigger>
            {isExpert && <TabsTrigger value="expert"><Shield className="h-4 w-4 mr-1" /> Expert Profile</TabsTrigger>}
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account"><Trash2 className="h-4 w-4 mr-1" /> Account</TabsTrigger>
          </TabsList>

          {/* Personal Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details and photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileData.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {profileData.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 shadow-md hover:bg-primary/90"
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{profileData.full_name || 'Set your name'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                      Change Photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={profileData.full_name}
                      onChange={e => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user.email || ''} disabled className="mt-1 bg-muted" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={profileData.phone}
                      onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={profileData.bio}
                    onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Profile</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expert Profile Tab */}
          {isExpert && expertData && (
            <TabsContent value="expert">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Expert Profile</CardTitle>
                      <CardDescription>Update your public expert profile</CardDescription>
                    </div>
                    <Badge variant={expertData.verification_status === 'verified' ? 'default' : 'secondary'}>
                      {expertData.verification_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expertData.verification_status === 'pending' && !isAdmin && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm flex items-start gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900">Profile Under Review</p>
                        <p className="text-amber-700 mt-0.5">Your profile is currently under review. Editing is temporarily disabled until verification completes.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={expertData.name}
                        onChange={e => setExpertData(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Professional Title</Label>
                      <Input
                        value={expertData.title}
                        onChange={e => setExpertData(prev => prev ? { ...prev, title: e.target.value } : null)}
                        placeholder="e.g., Startup Mentor"
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={expertData.company}
                        onChange={e => setExpertData(prev => prev ? { ...prev, company: e.target.value } : null)}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={expertData.location}
                        onChange={e => setExpertData(prev => prev ? { ...prev, location: e.target.value } : null)}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={expertData.phone}
                        onChange={e => setExpertData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={expertData.email}
                        onChange={e => setExpertData(prev => prev ? { ...prev, email: e.target.value } : null)}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Years of Experience</Label>
                      <Input
                        type="number"
                        value={expertData.experience_years || ''}
                        onChange={e => setExpertData(prev => prev ? { ...prev, experience_years: parseInt(e.target.value) || null } : null)}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>LinkedIn URL</Label>
                      <Input
                        value={expertData.linkedin_url}
                        onChange={e => setExpertData(prev => prev ? { ...prev, linkedin_url: e.target.value } : null)}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input
                        value={expertData.website_url}
                        onChange={e => setExpertData(prev => prev ? { ...prev, website_url: e.target.value } : null)}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={expertData.bio}
                      onChange={e => setExpertData(prev => prev ? { ...prev, bio: e.target.value } : null)}
                      rows={4}
                      className="mt-1"
                      disabled={expertData.verification_status === 'pending' && !isAdmin}
                    />
                  </div>

                  <div>
                    <Label>Expertise Areas (comma-separated)</Label>
                    <Input
                      value={expertData.expertise.join(', ')}
                      onChange={e => setExpertData(prev => prev ? { ...prev, expertise: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : null)}
                      placeholder="Startups, Marketing, Finance"
                      className="mt-1"
                      disabled={expertData.verification_status === 'pending' && !isAdmin}
                    />
                  </div>

                  <div>
                    <Label>Languages (comma-separated)</Label>
                    <Input
                      value={expertData.languages.join(', ')}
                      onChange={e => setExpertData(prev => prev ? { ...prev, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : null)}
                      placeholder="English, Hindi, Tamil"
                      className="mt-1"
                      disabled={expertData.verification_status === 'pending' && !isAdmin}
                    />
                  </div>

                  <Button onClick={saveExpertProfile} disabled={saving || (expertData.verification_status === 'pending' && !isAdmin)}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Expert Profile</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose which Irookee updates you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  ['email_booking_confirmed', 'Booking confirmation emails'],
                  ['email_expert_application', 'Expert application emails'],
                  ['email_expert_approved', 'Expert approval emails'],
                  ['in_app_notifications', 'In-app notifications'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <Label htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      checked={notificationPreferences[key as keyof NotificationPreferences]}
                      onCheckedChange={(checked) =>
                        setNotificationPreferences(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
                <Button onClick={saveNotificationPreferences} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Notifications</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account / Danger Zone Tab */}
          <TabsContent value="account">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-red-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-red-700">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This includes your profile,
                    {isExpert && ' expert profile, availability slots, categories,'}
                    {' '}and all personal information. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account Permanently?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, profile{isExpert ? ', expert profile,' : ''} and all associated data.
              This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                Type <strong>DELETE</strong> to confirm account deletion.
              </p>
            </div>
            <Input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deleting}
            >
              {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : 'Delete Account Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  )
}
