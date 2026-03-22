import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Exchange the code in the URL for a session
    supabase.auth.exchangeCodeForSession(window.location.search)
      .then(({ data, error }) => {
        if (error) {
          console.error('Auth error:', error);
          navigate('/auth', { replace: true });
        } else if (data.session) {
          navigate('/', { replace: true });
        } else {
          navigate('/auth', { replace: true });
        }
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
