import { createContext, useContext, useState, ReactNode } from "react";

interface ImpersonatedUser {
  id: string;
  name: string | null;
}

interface ImpersonateContextType {
  impersonatedUser: ImpersonatedUser | null;
  isImpersonating: boolean;
  startImpersonating: (user: ImpersonatedUser) => void;
  stopImpersonating: () => void;
  getEffectiveUserId: (realUserId: string | undefined) => string | undefined;
}

const ImpersonateContext = createContext<ImpersonateContextType | undefined>(undefined);

export function ImpersonateProvider({ children }: { children: ReactNode }) {
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  const isImpersonating = !!impersonatedUser;

  const startImpersonating = (user: ImpersonatedUser) => {
    setImpersonatedUser(user);
  };

  const stopImpersonating = () => {
    setImpersonatedUser(null);
  };

  // Retorna o ID do usuário impersonado se estiver impersonando, senão retorna o ID real
  const getEffectiveUserId = (realUserId: string | undefined) => {
    if (isImpersonating && impersonatedUser) {
      return impersonatedUser.id;
    }
    return realUserId;
  };

  return (
    <ImpersonateContext.Provider
      value={{
        impersonatedUser,
        isImpersonating,
        startImpersonating,
        stopImpersonating,
        getEffectiveUserId,
      }}
    >
      {children}
    </ImpersonateContext.Provider>
  );
}

export function useImpersonate() {
  const context = useContext(ImpersonateContext);
  if (context === undefined) {
    throw new Error("useImpersonate must be used within an ImpersonateProvider");
  }
  return context;
}
