export default {
  providers: [
    {
      type: 'customJwt',
      // domain: process.env.BASE_URL,
      applicationID: process.env.APP_NAME,
      issuer: process.env.BASE_URL,
      jwks: process.env.JWKS_URL,
      // convex only supports ES256 and RS256. Ideally would use Ed25519
      algorithm: 'RS256'
    },
    {
      type: 'customJwt',
      // domain: process.env.BASE_URL,
      applicationID: process.env.APP_NAME,
      issuer: 'http://localhost:3000',
      jwks: process.env.JWKS_URL,
      // convex only supports ES256 and RS256. Ideally would use Ed25519
      algorithm: 'RS256'
    }
  ]
}
