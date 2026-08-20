export default function Container({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-4 md:px-8 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </div>
  );
}
