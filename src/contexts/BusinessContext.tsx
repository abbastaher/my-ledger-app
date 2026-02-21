import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Business {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

interface BusinessContextType {
  businesses: Business[];
  activeBusiness: Business | null;
  setActiveBusiness: (b: Business | null) => void;
  loading: boolean;
  refetch: () => void;
}

const BusinessContext = createContext<BusinessContextType>({
  businesses: [],
  activeBusiness: null,
  setActiveBusiness: () => {},
  loading: true,
  refetch: () => {},
});

export const useBusiness = () => useContext(BusinessContext);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = async () => {
    if (!user) {
      setBusinesses([]);
      setActiveBusiness(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setBusinesses(data);
      if (!activeBusiness && data.length > 0) {
        setActiveBusiness(data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        setActiveBusiness,
        loading,
        refetch: fetchBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};
