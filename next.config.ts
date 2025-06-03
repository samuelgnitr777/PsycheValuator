import type { NextConfig } from 'next';

    const nextConfig: NextConfig = {
      /* config options here */
      typescript: {
        ignoreBuildErrors: true,
      },
      eslint: {
        ignoreDuringBuilds: true,
      },
      images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'placehold.co',
            port: '',
            pathname: '/**',
          },
        ],
      },
      // Add this property
      allowedDevOrigins: [
        'https://9003-firebase-studio-1748956429608.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev',
      ],
    };

    export default nextConfig;
