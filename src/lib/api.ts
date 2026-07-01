import { 
  Expert, 
  Category, 
  Booking, 
  Review, 
  Topic, 
  ExpertAvailability, 
  VerificationRequest,
  Testimonial,
  Achievement 
} from "@/types/speaker";
import { supabase } from "@/integrations/supabase/client";

// Helper functions for type conversion
const parseSpeakingFees = (fees: unknown): { virtual: number; in_person: number } => {
  if (typeof fees === 'object' && fees !== null) {
    return {
      virtual: Number(fees.virtual) || 0,
      in_person: Number(fees.in_person) || 0
    };
  }
  return { virtual: 0, in_person: 0 };
};

const parseSocialLinks = (links: unknown): { [key: string]: string } => {
  if (typeof links === 'object' && links !== null) {
    const result: { [key: string]: string } = {};
    Object.entries(links).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = value;
      }
    });
    return result;
  }
  return {};
};

const parseStringArray = (arr: unknown): string[] => {
  if (Array.isArray(arr)) {
    return arr.filter((item): item is string => typeof item === 'string');
  }
  return [];
};

// Experts API
export const getExperts = async (filters?: {
  expertise?: string[];
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  categories?: string[];
}) => {
  let query = supabase
    .from('speakers')
    .select(`
      *,
      speaker_categories (
        category_id
      )
    `);

  if (filters?.expertise && filters.expertise.length > 0) {
    query = query.contains('expertise', filters.expertise);
  }

  if (filters?.minPrice) {
    query = query.gte('hourly_rate', filters.minPrice);
  }

  if (filters?.maxPrice) {
    query = query.lte('hourly_rate', filters.maxPrice);
  }

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters?.categories && filters.categories.length > 0) {
    query = query.contains('speaker_categories.category_id', filters.categories);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching speakers:', error);
    throw error;
  }

  const transformedData: Expert[] = data.map(speaker => ({
    ...speaker,
    speaking_fees: parseSpeakingFees(speaker.speaking_fees),
    social_links: parseSocialLinks(speaker.social_links),
    badges: parseStringArray(speaker.badges),
    expertise: parseStringArray(speaker.expertise),
    languages: parseStringArray(speaker.languages),
    topics: parseStringArray(speaker.topics),
    preferred_audience: parseStringArray(speaker.preferred_audience),
    travel_preferences: typeof speaker.travel_preferences === 'object' ? speaker.travel_preferences : {}
  }));

  return transformedData;
};

export const getExpertById = async (id: string) => {
  const { data, error } = await supabase
    .from('speakers')
    .select(`
      *,
      speaker_categories (
        categories (
          id,
          name,
          description,
          created_at
        )
      ),
      reviews (
        *,
        bookings (
          event_name,
          event_date
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching speaker:', error);
    throw error;
  }

  const transformedData: Expert & {
    categories: Category[];
    reviews: (Review & { booking: Pick<Booking, 'event_name' | 'event_date'> })[];
  } = {
    ...data,
    speaking_fees: parseSpeakingFees(data.speaking_fees),
    social_links: parseSocialLinks(data.social_links),
    badges: parseStringArray(data.badges),
    expertise: parseStringArray(data.expertise),
    languages: parseStringArray(data.languages),
    topics: parseStringArray(data.topics),
    preferred_audience: parseStringArray(data.preferred_audience),
    travel_preferences: typeof data.travel_preferences === 'object' ? data.travel_preferences : {},
    categories: data.speaker_categories?.map(sc => ({
      id: sc.categories.id,
      name: sc.categories.name,
      description: sc.categories.description,
      created_at: sc.categories.created_at
    })) || [],
    reviews: data.reviews?.map(review => ({
      ...review,
      booking: {
        event_name: review.bookings.event_name,
        event_date: review.bookings.event_date
      }
    })) || []
  };

  return transformedData;
};

// Categories API
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data as Category[];
};

// Topics API
export const getTopics = async () => {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }

  return data as Topic[];
};

// Bookings API
export const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('expertise_bookings')
    .insert(booking)
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return data as Booking;
};

export const getUserBookings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('expertise_bookings')
    .select(`
      *,
      speakers (
        name,
        title,
        image_url
      )
    `)
    .or(`user_id.eq.${user.id},expert_id.in.(select id from speakers where user_id=${user.id})`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  const transformedData = data.map(booking => ({
    ...booking,
    speaker: {
      name: booking.speakers.name,
      title: booking.speakers.title,
      image_url: booking.speakers.image_url
    }
  }));

  return transformedData as (Booking & {
    speaker: Pick<Expert, 'name' | 'title' | 'image_url'>;
  })[];
};

// Reviews API
export const createReview = async (review: Omit<Review, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw error;
  }

  return data as Review;
};

// Expert profile management
export const createExpertProfile = async (
  expert: Omit<Expert, 'id' | 'user_id' | 'rating' | 'past_events' | 'created_at' | 'updated_at'>,
  categories: string[]
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data: expertData, error: expertError } = await supabase
    .from('speakers')
    .insert({
      ...expert,
      user_id: user.id,
    })
    .select()
    .single();

  if (expertError) {
    console.error('Error creating expert profile:', expertError);
    throw expertError;
  }

  if (categories.length > 0) {
    const categoryLinks = categories.map(categoryId => ({
      speaker_id: expertData.id,
      category_id: categoryId,
    }));

    const { error: categoriesError } = await supabase
      .from('speaker_categories')
      .insert(categoryLinks);

    if (categoriesError) {
      console.error('Error linking categories:', categoriesError);
      throw categoriesError;
    }
  }

  return expertData as Expert;
};

export const updateExpertProfile = async (
  id: string,
  updates: Partial<Expert>,
  categories?: string[]
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data: expertData, error: expertError } = await supabase
    .from('speakers')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (expertError) {
    console.error('Error updating expert profile:', expertError);
    throw expertError;
  }

  if (categories) {
    // First delete existing categories
    const { error: deleteError } = await supabase
      .from('speaker_categories')
      .delete()
      .eq('speaker_id', id);

    if (deleteError) {
      console.error('Error removing existing categories:', deleteError);
      throw deleteError;
    }

    // Then insert new ones
    if (categories.length > 0) {
      const categoryLinks = categories.map(categoryId => ({
        speaker_id: id,
        category_id: categoryId,
      }));

      const { error: categoriesError } = await supabase
        .from('speaker_categories')
        .insert(categoryLinks);

      if (categoriesError) {
        console.error('Error linking new categories:', categoriesError);
        throw categoriesError;
      }
    }
  }

  return expertData as Expert;
};

// Availability Management
export const addAvailability = async (availability: Omit<ExpertAvailability, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('speaker_availability')
    .insert(availability)
    .select()
    .single();

  if (error) {
    console.error('Error adding availability:', error);
    throw error;
  }

  return data as ExpertAvailability;
};

export const getExpertAvailability = async (expertId: string) => {
  const { data, error } = await supabase
    .from('speaker_availability')
    .select('*')
    .eq('speaker_id', expertId)
    .gte('date_end', new Date().toISOString())
    .order('date_start');

  if (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }

  return data as ExpertAvailability[];
};

// Verification API
export const submitVerificationRequest = async (
  request: Omit<VerificationRequest, 'id' | 'status' | 'submitted_at' | 'reviewed_at'>
) => {
  const { data, error } = await supabase
    .from('verification_requests')
    .insert(request)
    .select()
    .single();

  if (error) {
    console.error('Error submitting verification request:', error);
    throw error;
  }

  return data as VerificationRequest;
};

// Testimonials API
export const addTestimonial = async (
  testimonial: Omit<Testimonial, 'id' | 'created_at' | 'is_featured'>
) => {
  const { data, error } = await supabase
    .from('testimonials')
    .insert(testimonial)
    .select()
    .single();

  if (error) {
    console.error('Error adding testimonial:', error);
    throw error;
  }

  return data as Testimonial;
};

export const getExpertTestimonials = async (expertId: string) => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('speaker_id', expertId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching testimonials:', error);
    throw error;
  }

  return data as Testimonial[];
};

// Achievements API
export const addAchievement = async (
  achievement: Omit<Achievement, 'id' | 'created_at'>
) => {
  const { data, error } = await supabase
    .from('achievements')
    .insert(achievement)
    .select()
    .single();

  if (error) {
    console.error('Error adding achievement:', error);
    throw error;
  }

  return data as Achievement;
};

export const getExpertAchievements = async (expertId: string) => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('speaker_id', expertId)
    .order('date_achieved', { ascending: false });

  if (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }

  return data as Achievement[];
};

// Search functionality
export const searchExperts = async (query: string) => {
  const { data, error } = await supabase
    .from('speakers')
    .select(`
      *,
      speaker_categories!inner (
        categories (
          name
        )
      )
    `)
    .or(
      `name.ilike.%${query}%,title.ilike.%${query}%,bio.ilike.%${query}%,location.ilike.%${query}%`
    )
    .contains('expertise', [query]);

  if (error) {
    console.error('Error searching speakers:', error);
    throw error;
  }

  const transformedData = data.map(speaker => ({
    ...speaker,
    speaking_fees: parseSpeakingFees(speaker.speaking_fees),
    social_links: parseSocialLinks(speaker.social_links),
    badges: parseStringArray(speaker.badges),
    expertise: parseStringArray(speaker.expertise),
    languages: parseStringArray(speaker.languages),
    topics: parseStringArray(speaker.topics),
    preferred_audience: parseStringArray(speaker.preferred_audience),
    travel_preferences: typeof speaker.travel_preferences === 'object' ? speaker.travel_preferences : {},
    categories: speaker.speaker_categories.map(sc => ({
      name: sc.categories.name
    }))
  })) as (Expert & { categories: { name: string }[] })[];

  return transformedData;
};
