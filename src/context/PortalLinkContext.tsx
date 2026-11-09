import { createContext, useContext } from 'react';

/**
 * Returns the public portal link of a client (creating the client's portal page the first time),
 * or null when it cannot be made. Provided by App from useFirestoreData, so the "copy client link"
 * buttons deep in the dashboard do not need it passed through every component.
 */
export type GetPortalLink = (clientId: string) => string | null;

const PortalLinkContext = createContext<GetPortalLink | null>(null);

export const PortalLinkProvider = PortalLinkContext.Provider;

export function usePortalLink(): GetPortalLink | null {
  return useContext(PortalLinkContext);
}
