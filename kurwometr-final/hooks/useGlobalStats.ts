'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useGlobalStats() {
  const [count, setCount] = useState<number>(2137420);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Initial fetch
    supabase.from('global_stats').select('total_clicks').eq('id', 1).single()
      .then(({ data }) => { if (data) setCount(data.total_clicks); });

    // Realtime subscription
    const channel = supabase
      .channel('global_stats_rt')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'global_stats', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new?.total_clicks) setCount(payload.new.total_clicks as number);
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  const increment = async () => {
    const { data } = await supabase.rpc('increment_global_clicks', { delta: 1 });
    if (data) setCount(data);
    else setCount(c => c + 1);
  };

  return { count, increment };
}
