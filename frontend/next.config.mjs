/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
        },
        {
          protocol: 'https',
          hostname: '**.supabase.co',
        },
        {
          protocol: 'https',
          hostname: '**.amazonaws.com',
        },
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '4566',
        },
        {
          protocol: 'http',
          hostname: '127.0.0.1',
          port: '4566',
        },
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '8000',
        },
        {
          protocol: 'http',
          hostname: '127.0.0.1',
          port: '8000',
        },
        {
          protocol: 'http',
          hostname: 'backend',
          port: '8000',
        },
      ],
    },
    async rewrites() {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        
        return [
          {
            source: '/api/:path*',
            destination: `${backendUrl}/api/:path*`,
          },
        ];
      },
};

export default nextConfig;
