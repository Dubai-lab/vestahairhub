export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div
      className={`${sizes[size]} border-2 border-brand-500 border-t-transparent rounded-full animate-spin`}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="min-h-screen bg-space-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-white/40 text-sm">Loading…</p>
      </div>
    </div>
  )
}
