import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExperts } from '@/hooks/useExperts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MapPin, Languages, Calendar, Briefcase, ExternalLink, MessageSquare, BadgeCheck, Flag } from 'lucide-react'
import BookingModal from '@/components/BookingModal'
import { Expert } from '@/types/speaker'
import ExpertStatsCard from '@/components/gamification/ExpertStatsCard'
import ExpertTierBadge from '@/components/gamification/ExpertTierBadge'
import Navigation from '@/components/Navigation'
import Seo from '@/components/Seo'
import { supabase } from '@/integrations/supabase/client'
import { track } from '@/lib/analytics'
import { useAuth } from '@/components/AuthProvider'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface ReviewRow {
  id: string
  rating: number | null
  comment: string | null
  created_at: string
  reviewer_id: string | null
}

export default function ExpertProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { expert, loading } = useExperts(id)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportCategory, setReportCategory] = useState("spam")
  const [reportDescription, setReportDescription] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)

  const handleReportExpert = async () => {
    if (!user) {
      toast.error("Please log in to report an expert.")
      navigate(`/auth?redirect=/expert/${expert?.id}`)
      return
    }
    if (!reportDescription.trim()) {
      toast.error("Please provide a description of the issue.")
      return
    }

    setSubmittingReport(true)
    try {
      const { error } = await supabase
        .from("expert_reports")
        .insert({
          reporter_id: user.id,
          expert_id: expert?.id,
          category: reportCategory,
          description: reportDescription.trim(),
          status: "pending",
        })

      if (error) throw error

      toast.success("Report submitted. Thank you for keeping our community safe!")
      setIsReportOpen(false)
      setReportDescription("")
    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Could not submit report")
    } finally {
      setSubmittingReport(false)
    }
  }

  useEffect(() => {
    if (id) fetchReviews(id)
  }, [id])

  useEffect(() => {
    if (expert) {
      track('expert_profile_viewed', {
        expert_id: expert.id,
        expert_name: expert.name,
        rating: expert.rating,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expert?.id])

  const fetchReviews = async (expertId: string) => {
    setReviewsLoading(true)
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('speaker_id', expertId)
        .order('created_at', { ascending: false })
        .limit(20)
      setReviews((data || []) as ReviewRow[])
    } catch (e) {
      console.error('Error fetching reviews:', e)
    } finally {
      setReviewsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    )
  }

  if (!expert) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 text-center container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Expert not found</h1>
          <Button onClick={() => navigate('/experts')}>Browse Experts</Button>
        </div>
      </div>
    )
  }

  const expertTier = (expert.past_events || 0) >= 200 ? 4 :
    (expert.past_events || 0) >= 100 ? 3 :
    (expert.past_events || 0) >= 25 ? 2 :
    (expert.past_events || 0) >= 5 ? 1 : 0

  const expertForBooking: Expert = {
    id: expert.id,
    user_id: expert.user_id || '',
    name: expert.name,
    title: expert.title,
    email: expert.email || null,
    bio: expert.bio || '',
    expertise: expert.expertise || [],
    image_url: expert.image_url,
    rating: expert.rating || 0,
    hourly_rate: 0,
    currency: 'INR',
    availability_start: null,
    availability_end: null,
    location: expert.location || null,
    languages: expert.languages || [],
    past_events: expert.past_events || 0,
    created_at: expert.created_at,
    updated_at: expert.updated_at,
    is_verified: expert.is_verified || false,
    badges: expert.badges || [],
    social_links: {},
    video_url: null,
    topics: expert.topics || [],
    preferred_audience: [],
    speaking_fees: { virtual: 0, in_person: 0 },
    travel_preferences: {},
  }

  const openBooking = (source: string) => {
    track('booking_started', {
      expert_id: expert.id,
      expert_name: expert.name,
      source,
    })
    setIsBookingOpen(true)
  }

  const seoDescription = expert.bio
    ? expert.bio.slice(0, 155)
    : `Book a free session with ${expert.name}${expert.title ? `, ${expert.title}` : ''} on irookee.`

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Seo
        title={`${expert.name}${expert.title ? `  -  ${expert.title}` : ''}`}
        description={seoDescription}
        path={`/expert/${expert.id}`}
        image={expert.image_url || undefined}
        type="profile"
      />
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={expert.image_url ? `${expert.image_url}?t=${expert.updated_at && !isNaN(new Date(expert.updated_at).getTime()) ? new Date(expert.updated_at).getTime() : Date.now()}` : undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {expert.name?.charAt(0) || 'E'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-3xl">{expert.name}</CardTitle>
                      {expert.is_verified && (
                        <span
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5"
                          title="Verified expert"
                        >
                          <BadgeCheck className="h-4 w-4 text-blue-600" /> Verified
                        </span>
                      )}
                      <ExpertTierBadge tier={expertTier} />
                    </div>
                    <CardDescription className="text-lg mt-1">{expert.title}</CardDescription>
                    {expert.company && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <Briefcase className="h-3 w-3 inline mr-1" />
                        {expert.company}
                      </p>
                    )}
                    {expert.categories && expert.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {expert.categories.slice(0, 5).map((category, index) => (
                          <Badge key={index} variant="secondary" className="bg-primary/5 text-primary text-xs py-0.5 px-2 hover:bg-primary/5">
                            {category}
                          </Badge>
                        ))}
                        {expert.categories.length > 5 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground py-0.5 px-2">
                            +{expert.categories.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {expert.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">{expert.bio}</p>
                  </div>
                )}

                {expert.expertise && expert.expertise.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {expert.expertise.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-sm py-1 px-3">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {expert.topics && expert.topics.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {expert.topics.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {expert.experience_years && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" /> {expert.experience_years} years exp.
                    </div>
                  )}
                  {expert.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {expert.location}
                    </div>
                  )}
                  {expert.languages && expert.languages.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Languages className="h-4 w-4" /> {expert.languages.join(', ')}
                    </div>
                  )}
                </div>

                {(expert.linkedin_url || expert.website_url) && (
                  <div className="flex gap-3">
                    {expert.linkedin_url && (
                      <a href={expert.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> LinkedIn
                      </a>
                    )}
                    {expert.website_url && (
                      <a href={expert.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Website
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-medium mb-1">No reviews yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Be the first to connect with {expert.name?.split(' ')[0] || 'this expert'} and share your experience.
                    </p>
                    <Button size="sm" onClick={() => openBooking('empty_reviews')}>
                      Book the first session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 min-w-0 lg:sticky lg:top-24">
            <Card>
              <CardHeader>
                <CardTitle>Book a Free Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{(expert.rating || 0).toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({expert.past_events || 0} sessions)
                  </span>
                </div>

                <div className="text-2xl font-bold text-green-600">Free</div>

                <Button className="w-full" size="lg" onClick={() => openBooking('sidebar')}>
                  Book Session
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/booking?expertId=${expert.id}`)}>
                  View Calendar
                </Button>
                <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive text-xs" onClick={() => setIsReportOpen(true)}>
                  <Flag className="h-3 w-3 mr-2" /> Report Expert Profile
                </Button>
              </CardContent>
            </Card>

            <ExpertStatsCard expertId={expert.id} />
          </div>
        </div>
      </div>

      {/* Mobile sticky booking bar  -  the sidebar card is far down the page on
          small screens, so this keeps the primary CTA always reachable. */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
          <span className="font-semibold">{(expert.rating || 0).toFixed(1)}</span>
          <span className="text-sm text-green-600 font-medium truncate">· Free session</span>
        </div>
        <Button size="lg" className="shrink-0" onClick={() => openBooking('mobile_sticky')}>
          Book Session
        </Button>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        speaker={expertForBooking}
      />

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="h-5 w-5 fill-destructive/10" /> Report Expert Profile
            </DialogTitle>
            <DialogDescription>
              Help us understand what's wrong with this expert's profile or behavior. All reports are reviewed by our moderation team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Report Reason</Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam / Promotion</SelectItem>
                  <SelectItem value="abuse">Abusive / Inappropriate Behavior</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="misleading">Misleading Profile / Information</SelectItem>
                  <SelectItem value="other">Other Violation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                className="min-h-[120px]"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportOpen(false)} disabled={submittingReport}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReportExpert} disabled={submittingReport}>
              {submittingReport ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
