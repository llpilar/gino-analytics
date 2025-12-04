import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">404</h1>
        <p className="mb-4 text-xl text-zinc-400">Página não encontrada</p>
        <a href="/" className="text-cyan-400 underline hover:text-cyan-300">
          Voltar para o início
        </a>
      </div>
    </div>
  );
};

export default NotFound;