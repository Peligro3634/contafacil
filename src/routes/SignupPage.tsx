import { SignupForm } from '@/features/auth/SignupForm'

export function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">Crear cuenta</h1>
        <SignupForm />
      </div>
    </div>
  )
}
