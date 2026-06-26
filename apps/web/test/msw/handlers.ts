import { HttpResponse, http } from "msw"

type RpcBody = { id?: string | number; method?: string }

// Default Soroban RPC response shape for a successful simulateTransaction call.
// Tests that need a different shape (error, malformed) should use server.use()
// to override this handler for their specific request.
const simulateTransactionSuccess = {
  cost: { cpuInsns: "1000", memBytes: "1000" },
  results: [{ auth: [], xdr: "AAAAAA==" }],
  minResourceFee: "1000000",
  latestLedger: 12345,
  transactionData: "",
}

export const handlers = [
  http.post("https://soroban-testnet.stellar.org", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as RpcBody

    if (body.method === "simulateTransaction") {
      return HttpResponse.json({
        jsonrpc: "2.0",
        id: body.id ?? 1,
        result: simulateTransactionSuccess,
      })
    }

    return HttpResponse.json({ jsonrpc: "2.0", id: body.id ?? 1, result: {} })
  }),

  http.get("https://horizon-testnet.stellar.org/:path*", () => HttpResponse.json({})),
]
