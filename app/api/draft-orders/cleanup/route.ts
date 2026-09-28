import { NextResponse } from "next/server";
import { adminAccessToken, adminGraphql } from "@/lib/shopify-admin";

/**
 * Deletes abandoned draft orders.
 *
 * Every trip to checkout creates one, and the ones nobody pays for stay open
 * forever — fifty of them after a few weeks of testing. This removes open
 * drafts older than the window below.
 *
 * Only `status:open` is touched. A draft that was paid becomes `completed` and
 * carries the order, so it is never a candidate — which also keeps the cart's
 * own "was this paid?" check working: a completed draft survives to answer it,
 * and a deleted one reads as unknown, which leaves the cart alone.
 *
 * Runs from the Vercel cron in vercel.json. Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; without that secret set, the route
 * refuses rather than letting anyone on the internet delete orders.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAYS = 7;
/** A cap per run, so one invocation can't run away or time out. */
const MAX_PER_RUN = 100;

type DraftList = {
  data?: {
    draftOrders: {
      edges: { node: { id: string; name: string; createdAt: string; status: string } }[];
    };
  };
  errors?: { message: string }[];
};
type DeleteResult = {
  data?: { draftOrderDelete?: { deletedId: string | null; userErrors: { message: string }[] } };
};

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(dryRun: boolean) {
  const token = await adminAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Auth failed: Check Client ID/Secret" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  // Shopify's search syntax takes a date, not a timestamp
  const cutoffDay = cutoff.toISOString().slice(0, 10);

  const list = await adminGraphql<DraftList>(
    token,
    `query AbandonedDrafts($query: String!, $first: Int!) {
      draftOrders(first: $first, query: $query, sortKey: CREATED_AT) {
        edges { node { id name createdAt status } }
      }
    }`,
    { query: `status:open AND created_at:<${cutoffDay}`, first: MAX_PER_RUN }
  );

  if (list.errors?.length) {
    return NextResponse.json({ error: list.errors[0].message }, { status: 502 });
  }

  const candidates = (list.data?.draftOrders.edges ?? [])
    .map((e) => e.node)
    // belt and braces: the query already filters, but deleting a completed
    // draft would be deleting the record of a sale
    .filter((n) => n.status === "OPEN" && new Date(n.createdAt) < cutoff);

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      cutoff: cutoffDay,
      wouldDelete: candidates.length,
      names: candidates.map((n) => n.name),
    });
  }

  const deleted: string[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const draft of candidates) {
    const res = await adminGraphql<DeleteResult>(
      token,
      `mutation DeleteDraft($input: DraftOrderDeleteInput!) {
        draftOrderDelete(input: $input) { deletedId userErrors { message } }
      }`,
      { input: { id: draft.id } }
    );
    const out = res.data?.draftOrderDelete;
    if (out?.deletedId) deleted.push(draft.name);
    else failed.push({ name: draft.name, error: out?.userErrors?.[0]?.message ?? "nepoznata greška" });
  }

  return NextResponse.json({
    cutoff: cutoffDay,
    found: candidates.length,
    deleted: deleted.length,
    names: deleted,
    ...(failed.length ? { failed } : {}),
  });
}

/** The cron calls GET; ?dry=1 lists what would go without touching anything. */
export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Neovlašteno." }, { status: 401 });
  }
  const dryRun = new URL(request.url).searchParams.get("dry") === "1";
  return run(dryRun);
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Neovlašteno." }, { status: 401 });
  }
  return run(false);
}
