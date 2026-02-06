import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3">404</h1>
        <p className="text-gray-400 mb-6">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:underline">
          Return to Home
        </a>
      </div>
    </div>
  );
}