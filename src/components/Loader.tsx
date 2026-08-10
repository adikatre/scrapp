export default function Loader() {
  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/25 border-t-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground">Loading ...</p>
      </div>
    </div>
  );
}
