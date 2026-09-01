import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hkhuvtwtctlfmckuarmb.supabase.co'
const supabaseAnonKey = 'sb_publishable_C-6Wo5NbfmPEJHNsFHFxDQ_BgAS-uNQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
