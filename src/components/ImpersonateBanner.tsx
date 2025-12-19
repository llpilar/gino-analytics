import { useImpersonate } from "@/contexts/ImpersonateContext";
import { Button } from "@/components/ui/button";
import { X, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ImpersonateBanner() {
  const { isImpersonating, impersonatedUser, stopImpersonating } = useImpersonate();

  return (
    <AnimatePresence>
      {isImpersonating && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-white/20">
                <Eye className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <span className="opacity-90">Visualizando como:</span>
                <span className="font-semibold ml-2">{impersonatedUser?.name || 'Usuário'}</span>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 hover:text-white gap-2"
              onClick={stopImpersonating}
            >
              <X className="w-4 h-4" />
              Sair da visualização
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
