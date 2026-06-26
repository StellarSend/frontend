import { expectTypeOf, test } from "vitest"
import {
  i128ToScVal,
  parseSorobanError,
  ExchangeRouterClient,
  SyntheticsReaderClient,
  GlvRouterClient,
  StakingRouterClient,
  VestingRouterClient,
  ReferralStorageClient,
  OrderVaultClient,
  SacTokenClient,
  TokenClient,
  FaucetContractClient,
  TestTokenContractClient,
  type CreateOrderParams,
  type MarketProps,
  type PositionInfo,
  type ReferralInfo,
} from "."

test("public SDK exports retain their callable types", () => {
  expectTypeOf(parseSorobanError).parameter(0).toEqualTypeOf<unknown>()
  expectTypeOf(parseSorobanError).returns.toEqualTypeOf<string>()
  expectTypeOf(i128ToScVal).parameter(0).toEqualTypeOf<bigint>()
})

test("client classes are constructors", () => {
  expectTypeOf(ExchangeRouterClient).toBeConstructibleWith({} as any)
  expectTypeOf(SyntheticsReaderClient).toBeConstructibleWith({} as any)
  expectTypeOf(GlvRouterClient).toBeConstructibleWith({} as any)
  expectTypeOf(StakingRouterClient).toBeConstructibleWith({} as any)
  expectTypeOf(VestingRouterClient).toBeConstructibleWith({} as any)
  expectTypeOf(ReferralStorageClient).toBeConstructibleWith({} as any)
  expectTypeOf(OrderVaultClient).toBeConstructibleWith({} as any)
  expectTypeOf(SacTokenClient).toBeConstructibleWith({} as any)
  expectTypeOf(TokenClient).toBeConstructibleWith({} as any)
  expectTypeOf(FaucetContractClient).toBeConstructibleWith({} as any)
  expectTypeOf(TestTokenContractClient).toBeConstructibleWith({} as any)
})

test("key parameter types are exported correctly", () => {
  expectTypeOf<CreateOrderParams>().toBeObject()
  expectTypeOf<MarketProps>().toBeObject()
  expectTypeOf<PositionInfo>().toBeObject()
  expectTypeOf<ReferralInfo>().toBeObject()
})
