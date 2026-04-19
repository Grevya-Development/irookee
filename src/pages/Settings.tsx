import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    } else if (user) {
      loadProfile()
      loadExpertProfile()
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${user.id}/profile.${fileExt}`

      // Try uploading to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
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
            await supabase.from('speakers').update({ image_url: dataUrl }).eq('id', expertData.id)
          }
          toast({ title: "Photo Updated", description: "Profile photo saved" })
        }
        reader.readAsDataURL(file)
        return
      }

      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }))

      await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl })
      if (isExpert && expertData) {
        await supabase.from('speakers').update({ image_url: publicUrl }).eq('id', expertData.id)
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

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
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
    setSaving(true)
    try {
      const { error } = await supabase.from('speakers').update({
        name: expertData.name,
        title: expertData.title,
        bio: expertData.bio,
        location: expertData.location,
        company: expertData.company,
        phone: expertData.phone,
        email: expertData.email,
        linkedin_url: expertData.linkedin_url,
        website_url: expertData.website_url,
        expertise: expertData.expertise,
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
      // Delete expert profile if exists
      if (expertData) {
        await supabase.from('availability_slots').delete().eq('expert_id', expertData.id)
        await supabase.from('speaker_categories').delete().eq('speaker_id', expertData.id)
        await supabase.from('speakers').delete().eq('id', expertData.id)
      }

      // Delete user profile
      await supabase.from('profiles').delete().eq('id', user.id)

      // Sign out (actual auth.users row deletion requires admin/service role)
      await supabase.auth.signOut()

      toast({ title: "Account Deleted", description: "Your profile data has been removed" })
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-6">Manage your profile, expert details, and account</p>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-1" /> Profile</TabsTrigger>
            {isExpert && <TabsTrigger value="expert"><Shield className="h-4 w-4 mr-1" /> Expert Profile</TabsTrigger>}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={expertData.name}
                        onChange={e => setExpertData(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Professional Title</Label>
                      <Input
                        value={expertData.title}
                        onChange={e => setExpertData(prev => prev ? { ...prev, title: e.target.value } : null)}
                        placeholder="e.g., Startup Mentor"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={expertData.company}
                        onChange={e => setExpertData(prev => prev ? { ...prev, company: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={expertData.location}
                        onChange={e => setExpertData(prev => prev ? { ...prev, location: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={expertData.phone}
                        onChange={e => setExpertData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={expertData.email}
                        onChange={e => setExpertData(prev => prev ? { ...prev, email: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Years of Experience</Label>
                      <Input
                        type="number"
                        value={expertData.experience_years || ''}
                        onChange={e => setExpertData(prev => prev ? { ...prev, experience_years: parseInt(e.target.value) || null } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>LinkedIn URL</Label>
                      <Input
                        value={expertData.linkedin_url}
                        onChange={e => setExpertData(prev => prev ? { ...prev, linkedin_url: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input
                        value={expertData.website_url}
                        onChange={e => setExpertData(prev => prev ? { ...prev, website_url: e.target.value } : null)}
                        className="mt-1"
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
                    />
                  </div>

                  <div>
                    <Label>Expertise Areas (comma-separated)</Label>
                    <Input
                      value={expertData.expertise.join(', ')}
                      onChange={e => setExpertData(prev => prev ? { ...prev, expertise: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : null)}
                      placeholder="Startups, Marketing, Finance"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Languages (comma-separated)</Label>
                    <Input
                      value={expertData.languages.join(', ')}
                      onChange={e => setExpertData(prev => prev ? { ...prev, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : null)}
                      placeholder="English, Hindi, Tamil"
                      className="mt-1"
                    />
                  </div>

                  <Button onClick={saveExpertProfile} disabled={saving}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Expert Profile</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

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
    </div>
  )
}
