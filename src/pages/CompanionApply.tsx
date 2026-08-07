import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  HeartHandshake,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/sections/Footer';
import Seo from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
import { LocationInput } from '@/components/ui/location-input';
import { supabase } from '@/integrations/supabase/client';
import { formatAndValidatePhone } from '@/lib/phoneUtils';
import { createInAppNotification, notifyAdmins, sendNotificationEmail } from '@/lib/notifications';
import { TRUST_POINTS } from '@/lib/companionship';
import {
  buildCompanionSpeakerPayload,
  validateCompanionApplication,
  parseList,
  slugsFromServiceNames,
  COMPANION_AVAILABILITY_OPTIONS,
  COMPANION_ID_DOCUMENTS,
  MIN_BIO_LENGTH,
  SERVICE_NAME_OPTIONS,
  type CompanionApplicationInput,
  type UploadedDoc,
} from '@/lib/companionApplication';
import { ROUTE_SEO, HOME_CRUMB } from '@/lib/seoMeta';

/**
 * Companion application.
 *
 * "Apply as a companion" used to open /expert/onboarding — the generic expert
 * form, which asks for a professional title and expertise areas, has no field
 * for the companionship verticals or for where an applicant can physically go,
 * and treats ID upload as an optional badge-earner (COMP-2). Companionship is a
 * different job: someone arrives at a stranger's door, often for a frail person,
 * so the ID check is a gate rather than a bonus.
 */

const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali',
  'Gujarati', 'Punjabi', 'Odia', 'Assamese', 'Urdu', 'Sanskrit', 'Konkani',
  'Maithili', 'Sindhi', 'Nepali', 'French', 'German', 'Spanish', 'Mandarin',
  'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Russian', 'Italian',
];

const STEPS = [
  { title: 'About you', subtitle: 'Who people will be meeting', icon: Users },
  { title: 'How you can help', subtitle: 'Services, areas and availability', icon: HeartHandshake },
  { title: 'ID verification', subtitle: 'Required before you can be booked', icon: ShieldCheck },
];

const CompanionApply = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState('');
  const [travelAreas, setTravelAreas] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [idDocuments, setIdDocuments] = useState<UploadedDoc[]>([]);

  useEffect(() => {
    const prefill = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data: speaker } = await supabase
        .from('speakers')
        .select('verification_status, suspension_reason')
        .eq('user_id', user.id)
        .maybeSingle();

      if (speaker?.verification_status === 'suspended') {
        setIsSuspended(true);
        setSuspensionReason(speaker.suspension_reason || 'Suspended by admin');
        return;
      }

      setEmail(user.email || '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.phone) setPhone(profile.phone);
    };

    prefill().catch((error) => console.error('Failed to prefill application:', error));
  }, []);

  const asInput = (): CompanionApplicationInput => ({
    fullName,
    email,
    phone: formatAndValidatePhone(phone).normalized || phone.trim(),
    location,
    languages,
    bio,
    serviceSlugs: slugsFromServiceNames(serviceNames),
    experienceYears: Number(experienceYears),
    travelAreas: parseList(travelAreas),
    availability,
    idDocuments,
  });

  const goToStep2 = () => {
    const phoneCheck = formatAndValidatePhone(phone);
    if (!phoneCheck.isValid) {
      toast.error(phoneCheck.error || 'Please enter a valid phone number');
      return;
    }
    // Validate only what step 1 owns, so a later requirement cannot block here.
    const partial = validateCompanionApplication({
      ...asInput(),
      serviceSlugs: ['social'],
      experienceYears: 0,
      travelAreas: ['placeholder'],
      availability: ['Weekday mornings'],
      idDocuments: [{ name: 'placeholder', url: '', type: '' }],
    });
    if (!partial.isValid) {
      toast.error(partial.error!);
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    const partial = validateCompanionApplication({
      ...asInput(),
      idDocuments: [{ name: 'placeholder', url: '', type: '' }],
    });
    if (!partial.isValid) {
      toast.error(partial.error!);
      return;
    }
    setStep(3);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        toast.error('Please sign in first to upload your ID');
        navigate('/auth?redirect=/companionship/apply');
        return;
      }

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('verification-documents')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (error) {
          console.error('ID upload error:', error.message);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(data.path);

        setIdDocuments((prev) => [
          ...prev,
          { name: file.name, url: urlData.publicUrl, type: file.type },
        ]);
      }
      toast.success('ID uploaded');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('ID upload failed. Please try again.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeDoc = (index: number) =>
    setIdDocuments((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const input = asInput();
    const check = validateCompanionApplication(input);
    if (!check.isValid) {
      toast.error(check.error!);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        toast.error('Please sign in to submit your application');
        navigate('/auth?redirect=/companionship/apply');
        return;
      }

      const payload = buildCompanionSpeakerPayload(input, user.id);

      const { data: existing, error: existingError } = await supabase
        .from('speakers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (existingError) throw existingError;

      const write = existing
        ? await supabase.from('speakers').update(payload).eq('id', existing.id).select().single()
        : await supabase.from('speakers').insert(payload).select().single();

      if (write.error) throw write.error;
      const companion = write.data;

      // An ID is mandatory here, so a review request is always opened — a
      // companion is never listed on the strength of an unchecked document.
      if (companion) {
        const requestPayload = {
          speaker_id: companion.id,
          status: 'pending',
          submitted_at: payload.verification_documents.submitted_at,
          documents: payload.verification_documents,
          notes: `Companion application — ${payload.expertise.join(', ')}. ${idDocuments.length} ID document(s).`,
        };

        const { data: openRequest } = await supabase
          .from('verification_requests')
          .select('id')
          .eq('speaker_id', companion.id)
          .maybeSingle();

        if (openRequest) {
          await supabase
            .from('verification_requests')
            .update(requestPayload)
            .eq('id', openRequest.id);
        } else {
          await supabase.from('verification_requests').insert(requestPayload);
        }
      }

      // `profiles.user_type` is constrained to consumer/expert/both/admin, so a
      // companion is stored as a provider ("expert") like every other listing.
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: payload.name,
        email: user.email,
        user_type: 'expert',
        bio: payload.bio,
        phone: payload.phone,
      });

      if (user.email) {
        await sendNotificationEmail({
          to: user.email,
          subject: 'Your irookee companion application has been received',
          eventType: 'email_expert_application',
          html: `<p>Dear ${payload.name},</p><p>Thank you for applying to be an irookee companion. We have received your application and your ID is now being verified. You can be booked once verification completes.</p>`,
          userId: user.id,
        }).catch((error) => console.error('Failed to send application email:', error));
      }

      await createInAppNotification({
        userId: user.id,
        title: 'Companion application submitted',
        body: 'Your companion application is pending ID verification and admin review.',
        type: 'expert_application',
      }).catch((error) => console.error('Failed to create notification:', error));

      if (companion) {
        await notifyAdmins({
          title: 'New Companion Application',
          body: `${payload.name} applied as a companion for: ${payload.expertise.join(', ')}.`,
          type: 'expert_application',
          relatedId: companion.id,
        }).catch((error) => console.error('Failed to notify admins:', error));
      }

      toast.success('Application submitted! Your ID is under review.');
      navigate('/expert/dashboard');
    } catch (error) {
      console.error('Companion application failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 container mx-auto px-4 max-w-xl pt-32 pb-12 flex flex-col justify-center">
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="text-center">
                <ShieldAlert className="h-12 w-12 text-orange-600 mx-auto mb-2" aria-hidden="true" />
                <h1 className="text-2xl font-bold text-orange-800">Account suspended</h1>
                <p className="text-orange-700 mt-1">
                  Your companion application is blocked because this account has been
                  suspended by an administrator.
                </p>
              </div>
              <div className="p-3 bg-white border border-orange-200 rounded text-sm">
                <p><strong>Reason:</strong> {suspensionReason || 'No details provided.'}</p>
              </div>
              <Button onClick={() => navigate('/')} className="w-full">
                Return to homepage
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const StepIcon = STEPS[step - 1].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-background to-background flex flex-col">
      <Seo
        title={ROUTE_SEO.companionApply.title}
        description={ROUTE_SEO.companionApply.description}
        path={ROUTE_SEO.companionApply.path}
        breadcrumbs={[
          HOME_CRUMB,
          { name: 'Companionship', path: '/companionship' },
          { name: 'Apply as a companion', path: '/companionship/apply' },
        ]}
      />
      <Navigation />

      <main id="main" className="flex-1 container mx-auto max-w-3xl px-4 pt-24 pb-12">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/companionship">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Back to companionship
          </Link>
        </Button>

        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Verified companions only
          </p>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            Apply as a companion
          </h1>
          <p className="mt-2 text-muted-foreground">
            Be there for someone in your city. Companionship sessions carry no
            platform fee during early access.
          </p>
        </div>

        {/* Progress */}
        <div className="mt-8 mb-6">
          <ol className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-1 items-center last:flex-none">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    step > i + 1
                      ? 'bg-emerald-500 text-white'
                      : step === i + 1
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                  aria-current={step === i + 1 ? 'step' : undefined}
                >
                  {step > i + 1 ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : i + 1}
                </span>
                <span className="sr-only">{s.title}</span>
                {i < STEPS.length - 1 && (
                  <span
                    className={`mx-2 h-1 flex-1 rounded ${step > i + 1 ? 'bg-emerald-500' : 'bg-muted'}`}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm">
            <StepIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold">{STEPS[step - 1].title}</span>
            <span className="text-muted-foreground">— {STEPS[step - 1].subtitle}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* -------------------------------------------------------- step 1 */}
          {step === 1 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companion-name">Full name *</Label>
                    <Input
                      id="companion-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Meera Nair"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companion-email">Email *</Label>
                    <Input
                      id="companion-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companion-phone">Phone *</Label>
                    <Input
                      id="companion-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99668 27110"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companion-city">City you are based in *</Label>
                    <LocationInput value={location} onChange={setLocation} className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label>Languages you speak *</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    People often need a companion who speaks their language.
                  </p>
                  <div className="mt-1">
                    <MultiSelect
                      options={LANGUAGE_OPTIONS}
                      selected={languages}
                      onChange={setLanguages}
                      placeholder="Select languages..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="companion-bio">
                    Tell people about yourself * ({MIN_BIO_LENGTH}+ characters)
                  </Label>
                  <Textarea
                    id="companion-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Who you are, who you have helped before, and why people feel comfortable with you..."
                    rows={4}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bio.trim().length}/{MIN_BIO_LENGTH}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="button" size="lg" onClick={goToStep2}>
                    Next <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* -------------------------------------------------------- step 2 */}
          {step === 2 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div>
                  <Label>Which companionship services can you offer? *</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pick every one you are comfortable with. You will be listed under
                    each of them.
                  </p>
                  <div className="mt-1">
                    <MultiSelect
                      options={SERVICE_NAME_OPTIONS}
                      selected={serviceNames}
                      onChange={setServiceNames}
                      placeholder="Hospital Companion, Shopping Companion..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companion-years">
                      Years of experience helping people *
                    </Label>
                    <Input
                      id="companion-years"
                      type="number"
                      min="0"
                      step="1"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="3"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Caring for family counts. Enter 0 if this is new to you.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="companion-areas">
                      Areas you can travel to in person *
                    </Label>
                    <Input
                      id="companion-areas"
                      value={travelAreas}
                      onChange={(e) => setTravelAreas(e.target.value)}
                      placeholder="Saibaba Colony, Peelamedu, Gandhipuram"
                      className="mt-1"
                    />
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      Comma-separated neighbourhoods or towns you can reach.
                    </p>
                  </div>
                </div>

                <div>
                  <Label>When can you be there? *</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Companionship happens in person, so this is about real hours,
                    not calls.
                  </p>
                  <div className="mt-1">
                    <MultiSelect
                      options={[...COMPANION_AVAILABILITY_OPTIONS]}
                      selected={availability}
                      onChange={setAvailability}
                      placeholder="Weekday mornings, Weekend evenings..."
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Back
                  </Button>
                  <Button type="button" size="lg" onClick={goToStep3}>
                    Next <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* -------------------------------------------------------- step 3 */}
          {step === 3 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <div className="flex items-start gap-2">
                    <ShieldCheck
                      className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium text-indigo-900">
                        ID verification is required
                      </p>
                      <p className="mt-1 text-sm text-indigo-800">
                        Every companion completes ID verification before they can be
                        booked. You are going to someone&apos;s home, hospital or
                        errand — this is not optional.
                      </p>
                      <ul className="mt-2 list-inside list-disc text-sm text-indigo-800">
                        {COMPANION_ID_DOCUMENTS.map((doc) => (
                          <li key={doc}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-primary/50">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <span className="block text-muted-foreground">
                    {uploading ? 'Uploading...' : 'Click to upload your government ID'}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    PDF, JPG or PNG — up to 10MB each
                  </span>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>

                {idDocuments.length > 0 && (
                  <ul className="space-y-2">
                    {idDocuments.map((doc, index) => (
                      <li
                        key={doc.url || doc.name}
                        className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2.5"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                          {doc.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDoc(index)}
                          aria-label={`Remove ${doc.name}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-4">
                  {TRUST_POINTS.map((point) => (
                    <li key={point.title} className="flex gap-2 text-sm">
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{point.title}</span>
                        {' — '}
                        {point.body}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Back
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading || uploading || idDocuments.length === 0}
                  >
                    {loading ? 'Submitting...' : 'Submit for ID verification'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default CompanionApply;
