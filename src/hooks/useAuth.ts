import { useState, useCallback } from 'react';
import { signIn, signUp, confirmSignUp } from '@aws-amplify/auth';

type AuthMode = 'signin' | 'signup' | 'confirm';

export const useAuth = (onSuccess?: () => void) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      switch (mode) {
        case 'confirm':
          await confirmSignUp({ username: email, confirmationCode: confirmCode });
          setMode('signin');
          setConfirmCode('');
          break;

        case 'signup':
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }
          
          // Updated to include name.formatted as required by Cognito schema
          await signUp({
            username: email,
            password,
            options: {
              userAttributes: {
                email,
                name: name // Matches the User Pool schema
              }
            }
          });
          setMode('confirm');
          break;

        case 'signin':
          await signIn({ username: email, password });
          onSuccess?.();
          break;
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }

    setLoading(false);
  };

  const toggleMode = useCallback(() => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  }, [mode]);

  return {
    mode,
    email,
    name,
    password,
    confirmPassword,
    confirmCode,
    error,
    loading,
    setEmail,
    setName,
    setPassword,
    setConfirmPassword,
    setConfirmCode,
    handleSubmit,
    toggleMode,
    // Helper for checking if user is in confirm code mode
    isConfirming: mode === 'confirm'
  };
};