import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { FormError } from './ui/FormError';

type InputProps = {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const FormInput = ({ label, id, type, value, onChange }: InputProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={id}
      type={type}
      required
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  </div>
);

export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth(onSuccess);
  const isSignUp = auth.mode === 'signup';

  return (
    <form onSubmit={auth.handleSubmit} className="space-y-6">
      {auth.error && <FormError message={auth.error} />}
      
      <div className="space-y-4">
        {auth.mode === 'confirm' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900">
              Verify Your Email
            </h2>
            <p className="text-sm text-gray-600">
              Please enter the confirmation code sent to {auth.email}
            </p>
            <FormInput
              label="Confirmation Code"
              id="confirmCode"
              type="text"
              value={auth.confirmCode}
              onChange={(e) => auth.setConfirmCode(e.target.value)}
            />
            <Button type="submit" isLoading={auth.loading}>
              Verify Email
            </Button>
          </>
        ) : (
          <>
            {isSignUp && (
              <FormInput
                label="Full Name"
                id="name"
                type="text"
                value={auth.name}
                onChange={(e) => auth.setName(e.target.value)}
              />
            )}
            <FormInput
              label="Email address"
              id="email"
              type="email"
              value={auth.email}
              onChange={(e) => auth.setEmail(e.target.value)}
            />
            <FormInput
              label="Password"
              id="password"
              type="password"
              value={auth.password}
              onChange={(e) => auth.setPassword(e.target.value)}
            />
            {isSignUp && (
              <FormInput
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                value={auth.confirmPassword}
                onChange={(e) => auth.setConfirmPassword(e.target.value)}
              />
            )}
            <div className="space-y-3">
              <Button type="submit" isLoading={auth.loading}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
              <Button type="button" variant="secondary" onClick={auth.toggleMode}>
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"}
              </Button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}