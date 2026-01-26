import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        return { user: null, profile: null };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, role')
        .eq('user_id', user.id)
        .maybeSingle();

    return {
        user,
        profile
    };
};
