export const RoomsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center pb-32">
      <h1 className="text-3xl font-bold text-foreground mb-8">Rooms</h1>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-xs shadow-md">
        <p className="text-5xl mb-4">🐧</p>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-2">Nobody:</p>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-4">Absolutely nobody:</p>
        <p className="text-foreground font-bold text-lg">Me building a chat rooms feature at 2am:</p>
        <p className="text-4xl mt-4">🔨💻🔥</p>
      </div>
      <p className="mt-6 text-xs text-muted-foreground italic">coming soon™</p>
    </div>
  )
}
