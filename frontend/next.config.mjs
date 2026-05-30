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
      ],
    },
    async rewrites() {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        const isProd = process.env.NODE_ENV === 'production';
        
        return [
          {
            source: '/api/:path*',
            destination: isProd 
              ? '/_/backend/api/:path*' 
              : `${backendUrl}/api/:path*`,
          },
        ];
      },
};

export default nextConfig;
