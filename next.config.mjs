const backendApiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.verveuni.com"
).replace(/\/+$/, "")

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendApiUrl}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
