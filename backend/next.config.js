module.exports = {
  output: 'standalone',
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    JWT_VERIFICATION_SECRET: process.env.JWT_VERIFICATION_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    API_URL: process.env.NEXT_PUBLIC_API_URL
  },
  images: {
    domains: ['localhost'],
    loader: 'default',
    path: '/',
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'jsonwebtoken': require.resolve('jsonwebtoken')
    };
    return config;
  }
}