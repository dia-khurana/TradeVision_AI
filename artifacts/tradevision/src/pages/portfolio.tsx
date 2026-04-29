import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Portfolio() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto">
      {/* Abstract pure CSS illustration */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-2xl rotate-12 transition-transform hover:rotate-45 duration-700 ease-out" />
        <div className="absolute inset-0 bg-primary/40 rounded-2xl rotate-6 transition-transform hover:-rotate-12 duration-700 ease-out" />
        <div className="absolute inset-0 bg-card border-2 border-primary/50 rounded-2xl shadow-xl flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-3">Coming soon</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        Connect your broker to execute trades directly from signals and track your portfolio in real-time.
      </p>
      
      <Button disabled className="w-full sm:w-auto font-bold h-12 px-8">
        Notify me when ready
      </Button>
    </div>
  );
}
