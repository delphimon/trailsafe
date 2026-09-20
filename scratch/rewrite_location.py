import re

with open('src/hooks/use-location.ts', 'r') as f:
    content = f.read()

addition = """
import React, { createContext, useContext, useCallback, useMemo } from "react";

type LocationContextType = {
  fix: Fix | null;
  status: LocationStatus;
  requestLocation: () => () => void;
};

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState(0);
  const enabled = requests > 0;
  
  // The existing hook handles the watch automatically when enabled is true
  const { fix, status } = useAutomaticLocation(enabled);

  const requestLocation = useCallback(() => {
    setRequests((n) => n + 1);
    return () => setRequests((n) => Math.max(0, n - 1));
  }, []);

  const value = useMemo(() => ({ fix, status, requestLocation }), [fix, status, requestLocation]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within a LocationProvider");
  return ctx;
}
"""

content = content.replace('import { useEffect, useState } from "react";', 'import React, { useEffect, useState, createContext, useContext, useCallback, useMemo } from "react";')

content += addition

# Also add last-known fix acquisition to useAutomaticLocation
# "On native iOS/Android emergency contexts: 1. Start fresh high-accuracy acquisition immediately. 2. Also query the OS for a recent last-known position. 3. If a usable recent position exists, show it immediately. 4. Clearly label it as last-known until replaced by a live fix."
# We can add Location.getLastKnownPositionAsync()

replacement_start = """
        if (cancelled) return;
        if (permission.status !== "granted") {
          setStatus("denied");
          return;
        }
        timeout = setTimeout(unavailable, 15000);
        
        // Query last-known position first
        try {
          const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
          if (!cancelled && last && status !== "located") {
            receive(last);
          }
        } catch {}

        subscription = await Location.watchPositionAsync(
"""

content = content.replace("""        if (cancelled) return;
        if (permission.status !== "granted") {
          setStatus("denied");
          return;
        }
        timeout = setTimeout(unavailable, 15000);
        subscription = await Location.watchPositionAsync(""", replacement_start)

with open('src/hooks/use-location.ts', 'w') as f:
    f.write(content)
