import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-background to-muted px-6 py-16 text-center">
      
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Placement Portal App
      </h1>

      <p className="mt-4 text-lg text-muted-foreground max-w-xl">
        Connect, communicate and collaborate securely.
      </p>

      <div className="mt-8">
        <Button onClick={() => navigate("/login")}>
          Get Started
        </Button>
      </div>

    </main>
  );
}