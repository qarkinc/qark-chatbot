import React from "react";

export interface AgentInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
}

export function useAgent(): AgentInfo {
  const [agentInfo, setAgentInfo] = React.useState<AgentInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: "",
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent || navigator.vendor || "";
      const isMobile = /iPhone|Android.*Mobile|Windows Phone|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
      const isDesktop = !isMobile && !isTablet;

      setAgentInfo({
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
      });
    }
  }, []);

  return agentInfo;
}
