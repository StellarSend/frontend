import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "../../../test/msw/server"
import { horizonServer } from "./horizon"

const ACCOUNT_ID = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"

const accountFixture = {
  id: ACCOUNT_ID,
  account_id: ACCOUNT_ID,
  sequence: "100",
  subentry_count: 0,
  thresholds: { low_threshold: 0, med_threshold: 0, high_threshold: 0 },
  flags: { auth_required: false, auth_revocable: false, auth_immutable: false },
  balances: [],
  signers: [{ weight: 1, key: ACCOUNT_ID, type: "ed25519_public_key" }],
  data: {},
}

describe("horizonServer.loadAccount", () => {
  it("returns parsed account data on success", async () => {
    server.use(
      http.get(`https://horizon-testnet.stellar.org/accounts/${ACCOUNT_ID}`, () =>
        HttpResponse.json(accountFixture),
      ),
    )

    const account = await horizonServer.loadAccount(ACCOUNT_ID)

    expect(account.id).toBe(ACCOUNT_ID)
    expect(account.sequence).toBe("100")
  })

  it("throws when the account does not exist (404)", async () => {
    server.use(
      http.get("https://horizon-testnet.stellar.org/accounts/:id", () =>
        HttpResponse.json(
          {
            type: "https://stellar.org/horizon-errors/not_found",
            title: "Resource Missing",
            status: 404,
          },
          { status: 404 },
        ),
      ),
    )

    await expect(
      horizonServer.loadAccount("GNON_EXISTENT_ACCOUNT_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    ).rejects.toThrow()
  })
})
