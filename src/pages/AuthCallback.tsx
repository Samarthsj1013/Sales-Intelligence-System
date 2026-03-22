import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle both hash-based (implicit) and code-based (PKCE) flows
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken) {
      // Implicit flow - set session directly from hash
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ error }) => {
        if (error) {
          navigate('/auth', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      });
    } else {
      // PKCE flow - exchange code
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        supabase.auth.exchangeCodeForSession(window.location.search)
          .then(({ error }) => {
            navigate(error ? '/auth' : '/', { replace: true });
          });
      } else {
        // No token or code found - redirect to auth
        navigate('/auth', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
