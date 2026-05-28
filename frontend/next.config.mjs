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
      ],
    },
    async rewrites() {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        return [
          {
            source: '/api/:path*',
            destination: `${backendUrl}/:path*`,
          },
        ];
      },
};

export default nextConfig;
