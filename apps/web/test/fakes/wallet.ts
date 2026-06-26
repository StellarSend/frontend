export const fakeWalletAddress = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
export const fakeSignedXdr = "AAAAAgAAAAAFakeSignedTransactionEnvelope"

export const fakeSigner = {
  signTransaction() {
    return { signedTxXdr: fakeSignedXdr }
  },
}
