import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

const ProfileSetup = () => {
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [approvedProfile, setApprovedProfile] = useState<{
    id: string
    full_name: string
    email: string
    company: string
    phone: string
    bio: string
    hourly_rate: number
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: user?.email || '',
    company: '',
    phone: '',
    bio: '',
    hourly_rate: '100',
  });

  useEffect(() => {
    if (user) {
      checkUserProfile();
      checkApprovedProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasProfile(true);
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const checkApprovedProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('guest_profiles')
        .select('*')
        .eq('email', user?.email)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setApprovedProfile(data);
        setFormData(prev => ({
          ...prev,
          full_name: data.full_name || '',
          company: data.company || '',
          phone: data.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error checking approved profile:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('user_profiles').insert({
        user_id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        bio: formData.bio,
        hourly_rate: parseFloat(formData.hourly_rate) || 100,
      });

      if (error) throw error;

      toast({
        title: 'Profile Created!',
        description: 'Your expert profile has been created successfully.',
      });

      setHasProfile(true);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (hasProfile) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle>Profile Complete</CardTitle>
          </div>
          <CardDescription>
            Your expert profile is active and ready to receive bookings!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You can now receive booking requests from customers. Visit your dashboard to manage your bookings.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!approvedProfile) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Setup Required</CardTitle>
          <CardDescription>
            Your application is still being reviewed or you haven't submitted one yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please submit a guest profile application and wait for approval before creating your expert profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Expert Profile</CardTitle>
        <CardDescription>
          Your application has been approved! Complete your profile to start receiving bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hourly_rate">Hourly Rate (USD) *</Label>
            <Input
              id="hourly_rate"
              name="hourly_rate"
              type="number"
              min="1"
              value={formData.hourly_rate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about your expertise and experience..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating Profile...' : 'Create Expert Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSetup;