import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components

const ResetPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is redirected here after clicking the reset link
        // The Auth component will handle the password update UI
      } else if (event === 'SIGNED_IN' && session) {
        // After successful password update, user is signed in
        toast.success('Senha redefinida com sucesso!');
        navigate('/');
      } else if (event === 'SIGNED_OUT') {
        // If for some reason they sign out after recovery, redirect to login
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl gradient-text">CONEX.HUB</CardTitle>
          <CardDescription>
            Redefina sua senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            view="update_password"
            showLinks={false} // Don't show sign-in/sign-up links here
            providers={[]} // No social providers for password reset
            localization={{
              variables: {
                update_password: {
                  password_label: 'Nova Senha',
                  password_input_placeholder: 'Sua nova senha',
                  button_label: 'Redefinir Senha',
                  // social_provider_text: 'Entrar com {{provider}}', // Removido: não suportado para update_password
                  link_text: 'Já tem uma conta? Faça login',
                  confirmation_text: 'Verifique seu e-mail para o link de redefinição de senha',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;