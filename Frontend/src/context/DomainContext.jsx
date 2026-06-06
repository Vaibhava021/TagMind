import { createContext, useState, useEffect } from "react";


export const DomainContext = createContext();

export const DomainProvider = ({ children }) => {
  const [domain, setDomain] = useState("Loading...");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setDomain(url.hostname.replace("www.", ""));
      }
    });
  }, []);

  return (
    <DomainContext.Provider value={{ domain, setDomain }}>
      {children}
    </DomainContext.Provider>
  );
};