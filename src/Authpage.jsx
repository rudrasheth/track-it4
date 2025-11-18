import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient'; // Import your client

function AuthPage() {
  return (
    <div style={{ width: '320px', margin: '50px auto' }}>
      <h3>Welcome to trackit2</h3>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSopa }}
        theme="dark"
      />
    </div>
  );
}

export default AuthPage;