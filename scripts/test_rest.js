import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlsdxbjoghpfzltubshs.supabase.co',
  'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD'
);

const run = async () => {
  const { data, error } = await supabase
    .from('expert_reports')
    .select(`
      id,
      reporter_id,
      expert_id,
      category,
      description,
      status,
      admin_notes,
      created_at,
      reporter:profiles(full_name, email),
      expert:speakers(id, name, title, verification_status)
    `);
  console.log("Reports Data:", data);
  console.log("Reports Error:", error);

  const { data: notifData, error: notifError } = await supabase
    .from('notifications')
    .select('id, title, body, type, read_at, created_at');
  console.log("Notifications Data:", notifData);
  console.log("Notifications Error:", notifError);
};

run();
