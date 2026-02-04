import { useParams, useNavigate } from 'react-router-dom'
import { useExperts } from '@/hooks/useExperts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MapPin, Languages, Clock, DollarSign } from 'lucide-react'
export default function ExpertProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { expert, loading } = useExperts(id)

  if (loading) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!expert) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Expert not found</h1>
          <Button onClick={() => navigate('/search')}>Back to Search</Button>
        </div>
      </div>
    )
  }

  const profile = expert.profiles

  return (
    <div className="min-h-screen py-12 container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.charAt(0) || 'E'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-3xl">{profile?.full_name || 'Expert'}</CardTitle>
                  <CardDescription className="text-lg mt-1">{expert.title}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{profile?.bio || 'No bio available'}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Expertise Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.expertise_areas.map((area, index) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              {expert.experience_years && (
                <div>
                  <h3 className="font-semibold mb-2">Experience</h3>
                  <p className="text-muted-foreground">
                    {expert.experience_years} years of experience
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{expert.rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({expert.total_sessions} sessions)
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-5 w-5" />
                <span className="text-2xl font-bold">${expert.hourly_rate}</span>
                <span>/hour</span>
              </div>

              {expert.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{expert.location}</span>
                </div>
              )}

              {expert.languages && expert.languages.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Languages className="h-5 w-5" />
                  <span>{expert.languages.join(', ')}</span>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate(`/booking?expertId=${expert.id}`)}
              >
                Book Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

