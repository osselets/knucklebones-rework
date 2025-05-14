<p align="center">
  <a href="https://knucklebones.io" target="_blank">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./.github/logo-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="./.github/logo-light.svg">
      <img alt="Knucklebones" src="./.github/logo-light.svg" width="525" height="105" style="max-width: 100%;">
    </picture>
  </a>
</p>

<p align="center">
  The Knucklebones dice game in <a href="https://www.cultofthelamb.com/" target="_blank">Cult of the Lamb</a>.
</p>

---

You can find the game at [knucklebones.io](https://knucklebones.io/).

The frontend is built with: [React](https://reactjs.org/), [Vite](https://vitejs.dev/) & [Tailwind CSS](https://tailwindcss.com/).

The backend is built with: [Cloudflare Workers](https://developers.cloudflare.com/workers/) & [Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)

The frontend is hosted with [Cloudflare Pages](https://developers.cloudflare.com/pages/) while the backend is a Cloudflare Worker.

All of it is written with [TypeScript](https://www.typescriptlang.org/).

## Repository structure

We use [Turborepo](https://turbo.build/) to manage our monorepo.

The `apps` directory contains the React application (`front`) and the Cloudflare Worker (`worker`) (along with the definition of the Durable Object).

The `packages` directory contains code that's shared between the React application and Cloudflare worker.

## Legal disclaimer

The original Knucklebones game in Cult of the Lamb was created by Massive Monster. This is a fan-site and not an official implementation by Massive Monster. You can find the original game on the [Cult of the Lamb](https://www.cultofthelamb.com/) website.

## db management

```sh
# based on this https://www.better-auth.com/docs/adapters/drizzle#schema-generation--migration
# generate auth-schema, only when updating better-auth configuration
pnpm gen-auth-schema

# generate SQL migrations
pnpm drizzle-kit generate

# run migrations
pnpm drizzle-kit migrate
```

## cloudflare

### pages dev

- should generate the .dev.vars automatically
- start command should be wrangler pages dev --port 3000

## things to add later

- vite-env-only
- @t3-oss/env-core

## où j'en suis

Je setup l'authentification entre Better Auth et Convex. Pour ça il faut que le client récupère un JWT et l'expose à Convex : https://docs.convex.dev/auth/advanced/custom-auth#integrating-a-new-identity-provider
C'est ok avec la méthode `authClient.token()`, mais ça en génère un nouveau à chaque fois, car ils sont pas stockés en BDD. Je sais pas si c'est une bonne ou une mauvaise chose, si je dois les stocker dans le local storage moi-même, et pourquoi il n'y a pas de refresh token à utiliser pour générer un nouveau JWT. Je sais pas trop quel processus ça suit. Peut-être avec le plugin bearer ça marcherait mieux ? Après techniquement, ça conviendrait à Convex, sur le papier. Mais ça a pas l'air opti.
