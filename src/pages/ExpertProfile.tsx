import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExperts } from '@/hooks/useExperts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MapPin, Languages, Calendar, Shield, Briefcase, ExternalLink, MessageSquare } from 'lucide-react'
import BookingModal from '@/components/BookingModal'
import { Expert } from '@/types/speaker'
import ExpertStatsCard from '@/components/gamification/ExpertStatsCard'
import ExpertTierBadge from '@/components/gamification/ExpertTierBadge'
import Navigation from '@/components/Navigation'
import { supabase } from '@/integrations/supabase/client'

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
  const { expert, loading } = useExperts(id)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    if (id) fetchReviews(id)
  }, [id])

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
          <Button onClick={() => navigate('/speakers')}>Browse Experts</Button>
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={expert.image_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {expert.name?.charAt(0) || 'E'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-3xl">{expert.name}</CardTitle>
                      {expert.verification_status === 'verified' && (
                        <Shield className="h-5 w-5 text-green-600" />
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
                  <p className="text-muted-foreground text-center py-4">No reviews yet. Be the first to book and review!</p>
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
          <div className="space-y-6">
            <Card className="sticky top-24">
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

                <Button className="w-full" size="lg" onClick={() => setIsBookingOpen(true)}>
                  Book Session
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/booking?expertId=${expert.id}`)}>
                  View Calendar
                </Button>
              </CardContent>
            </Card>

            <ExpertStatsCard expertId={expert.id} />
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        speaker={expertForBooking}
      />
    </div>
  )
}
