import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MapPin, Languages, Clock, Sparkles } from 'lucide-react'
import type { ExpertProfile } from '@/lib/supabase'

interface ExpertCardProps {
  expert: ExpertProfile
  onBook?: (expertId: string) => void
}

export function ExpertCard({ expert, onBook }: ExpertCardProps) {
  const navigate = useNavigate()
  const profile = expert.profiles

  const handleBook = () => {
    if (onBook) {
      onBook(expert.id)
    } else {
      navigate(`/booking?expertId=${expert.id}`)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'E'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{getInitials(profile?.full_name || null)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{profile?.full_name || 'Expert'}</h3>
              <p className="text-sm text-muted-foreground">{expert.title}</p>
            </div>
          </div>
          {expert.match_score !== undefined && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {expert.match_score}% match
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {profile?.bio || 'No bio available'}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{expert.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({expert.total_sessions} sessions)
            </span>
          </div>

          {expert.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {expert.location}
            </div>
          )}

          {expert.languages && expert.languages.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Languages className="h-4 w-4" />
              {expert.languages.slice(0, 2).join(', ')}
              {expert.languages.length > 2 && ` +${expert.languages.length - 2}`}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {expert.expertise_areas.slice(0, 3).map((area, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {area}
            </Badge>
          ))}
          {expert.expertise_areas.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{expert.expertise_areas.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold">${expert.hourly_rate}</span>
            <span className="text-sm text-muted-foreground">/hour</span>
          </div>
          {expert.experience_years && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {expert.experience_years} years
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigate(`/expert/${expert.id}`)}
        >
          View Profile
        </Button>
        <Button 
          className="flex-1"
          onClick={handleBook}
        >
          Book Session
        </Button>
      </CardFooter>
    </Card>
  )
}

