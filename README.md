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

Ruta poziva `revalidateTag("products")` **i** `revalidatePath` za sve stranice
koje prikazuju proizvode. Tag je bitniji dio: stranice s popisima su dinamičke i
ionako se iscrtavaju na svaki zahtjev, pa nije zastarjela stranica nego Shopify
odgovor ispod nje, koji ima vlastiti cache od 300 s. Svaki dohvat iz
`lib/shopify.ts` zato nosi oznaku `products` — dodaje se u samom wrapperu, da se
nova upita ne može napisati bez nje.

Provjera da radi: izmijenite cijenu u Shopifyju i osvježite **stranicu popisa**
(/racunala), ne samo stranicu proizvoda — upravo je popis bio taj koji je
zadržavao staru cijenu.
U Shopifyju se pod webhookom vidi i zadnji odgovor (200 = prošlo).

## Čišćenje skica narudžbi

Svaki odlazak na blagajnu stvara Shopify *draft order*. One koje nitko ne plati
ostaju otvorene zauvijek, pa ih se u administraciji nakupi. `GET
/api/draft-orders/cleanup` briše **otvorene** skice starije od 7 dana.

Plaćene se ne diraju: plaćanjem skica postaje `completed` i nosi narudžbu, pa
nikad nije kandidat. To ujedno čuva provjeru „je li narudžba plaćena" kojom
košarica sama sebe prazni.

**Postavljanje**

1. U Vercel dodajte varijablu `CRON_SECRET` (bilo koji dug nasumičan niz —
   `openssl rand -hex 32`). Ovaj ključ izmišljate vi, za razliku od
   `SHOPIFY_WEBHOOK_SECRET` koji mora biti Shopifyjev.
2. Redeploy. Vercel sam poziva rutu prema rasporedu iz `vercel.json`
   (svaki dan u 03:00 UTC) i pritom šalje `Authorization: Bearer $CRON_SECRET`.

Bez tog ključa ruta odgovara `401` i ne briše ništa — namjerno, jer endpoint
koji briše narudžbe ne smije biti otvoren.

**Ručna provjera prije prvog brisanja**

```
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.racunalo.hr/api/draft-orders/cleanup?dry=1"
```

`?dry=1` samo ispiše koje bi skice obrisao, bez diranja ičega.
