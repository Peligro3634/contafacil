import { LoginForm } from '@/features/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">ContaFacil</h1>
        <LoginForm />
      </div>
    </div>
  )
}
