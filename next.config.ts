import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/gotova-racunala", destination: "/racunala", permanent: true },
      { source: "/gaming-racunala", destination: "/racunala/gaming", permanent: true },
      { source: "/radne-stanice", destination: "/racunala/radne-stanice", permanent: true },
      { source: "/monitori", destination: "/periferija/monitori", permanent: true },
      { source: "/tipkovnice", destination: "/periferija/tipkovnice", permanent: true },
      { source: "/misevi", destination: "/periferija/misevi", permanent: true },
      { source: "/slusalice", destination: "/periferija/slusalice", permanent: true },
    ];
  },
};

export default nextConfig;
