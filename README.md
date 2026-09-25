This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Osvježavanje sadržaja iz Shopifyja

Podaci s dućana dohvaćaju se s `revalidate: 300`, pa bi izmjena cijene ili
opisa bez webhooka bila vidljiva tek nakon isteka tog prozora. Zato postoji
`POST /api/revalidate`.

**Postavljanje u Shopifyju** — Settings → Notifications → Webhooks, dodajte tri
webhooka, svaki u JSON formatu, na adresu:

```
https://www.racunalo.hr/api/revalidate
```

| Događaj | Čemu služi |
|---|---|
| `products/create` | novi proizvod odmah ulazi u liste |
| `products/update` | promjena cijene, opisa, slike ili zalihe |
| `products/delete` | uklonjeni proizvod nestaje s lista |

Shopify uz webhook prikaže **signing secret**. Upišite ga u Vercel kao
`SHOPIFY_WEBHOOK_SECRET`. Ruta provjerava HMAC potpis (`X-Shopify-Hmac-Sha256`)
i bez ispravnog secreta odgovara `503` — namjerno, jer nepotpisani endpoint koji
na zahtjev briše cache je besplatan način da se stranica natjera na neprekidno
ponovno dohvaćanje.

Provjera da radi: izmijenite cijenu u Shopifyju i osvježite stranicu proizvoda.
U Shopifyju se pod webhookom vidi i zadnji odgovor (200 = prošlo).
