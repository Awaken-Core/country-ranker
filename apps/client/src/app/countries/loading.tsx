export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary mb-4" />
      <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
        Loading Country Data...
      </p>
    </div>
  );
}
