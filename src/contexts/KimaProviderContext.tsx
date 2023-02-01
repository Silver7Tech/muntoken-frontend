import React, {
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
  } from "react";
  
  interface IKimaProviderContext {
    connect(): void;
    disconnect(): void;
    chainId: number | undefined;
  
    kimaAddress: string | undefined;
    kimaSignerClient: any;
  }
  
  const KimaProviderContext = React.createContext<IKimaProviderContext>({
    connect: () => {},
    disconnect: () => { },
    chainId: undefined,
    kimaAddress: undefined,
    kimaSignerClient: null
  });
  
  export const KimachainProvider = ({
    children,
  }: {
    children: ReactNode;
  }) => {
    const [chainId, setChainId] = useState<number | undefined>(undefined);
    const [kimaAddress, setWalletAddress] = useState<string | undefined>(undefined);
    const [kimaSignerClient, setWalletClient] = useState<any>(undefined);
  
    // Button handler button for handling a request window event for Keplr.
    const connect = useCallback(async () => {
      if (window.keplr) {
        if (!window.getOfflineSigner || !window.keplr) {
          alert("Please install keplr extension");
        } else {
          if (window.keplr.experimentalSuggestChain) {
            try {
              await window.keplr.experimentalSuggestChain({
                // Chain-id of the Cosmos SDK chain.
                chainId: "test",
                // The name of the chain to be displayed to the user.
                chainName: "Kimachain",
                // RPC endpoint of the chain.
                rpc: "https://testnode1.kima.finance",
                // REST endpoint of the chain.
                rest: "https://api.testnode1.kima.finance",
                // Staking coin information
                stakeCurrency: {
                  // Coin denomination to be displayed to the user.
                  coinDenom: "KMA",
                  // Actual denom (i.e. uatom, uscrt) used by the blockchain.
                  coinMinimalDenom: "uKMA",
                  // # of decimal points to convert minimal denomination to user-facing denomination.
                  coinDecimals: 9,
                  // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                  // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                  // coinGeckoId: ""
                },
                bip44: {
                  // You can only set the coin type of BIP44.
                  // 'Purpose' is fixed to 44.
                  coinType: 118,
                },
                bech32Config: {
                  bech32PrefixAccAddr: "kima",
                  bech32PrefixAccPub: "kimapub",
                  bech32PrefixValAddr: "kimavaloper",
                  bech32PrefixValPub: "kimavaloperpub",
                  bech32PrefixConsAddr: "kimavalcons",
                  bech32PrefixConsPub: "kimavalconspub"
                },
                // List of all coin/tokens used in this chain.
                currencies: [{
                  // Coin denomination to be displayed to the user.
                  coinDenom: "KMA",
                  // Actual denom (i.e. uatom, uscrt) used by the blockchain.
                  coinMinimalDenom: "uKMA",
                  // # of decimal points to convert minimal denomination to user-facing denomination.
                  coinDecimals: 9,
                  // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                  // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                  // coinGeckoId: ""
                }],
                // List of coin/tokens used as a fee token in this chain.
                feeCurrencies: [{
                  // Coin denomination to be displayed to the user.
                  coinDenom: "KMA",
                  // Actual denom (i.e. uatom, uscrt) used by the blockchain.
                  coinMinimalDenom: "uKMA",
                  // # of decimal points to convert minimal denomination to user-facing denomination.
                  coinDecimals: 9,
                  // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
                  // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
                  // coinGeckoId: ""
                }],
                // (Optional) This is used to set the fee of the transaction.
                // If this field is not provided, Keplr extension will set the default gas price as (low: 0.01, average: 0.025, high: 0.04).
                // Currently, Keplr doesn't support dynamic calculation of the gas prices based on on-chain data.
                // Make sure that the gas prices are higher than the minimum gas prices accepted by chain validators and RPC/REST endpoint.
                gasPriceStep: {
                  low: 0.01,
                  average: 0.025,
                  high: 0.04
                }
              });
            } catch {
              alert("Failed to suggest the chain");
            }
          } else {
            alert("Please use the recent version of keplr extension");
          }
        }
  
        const chainId = "test"
        // Unlock the wallet.
        await window.keplr.enable(chainId);
  
        // Use offlineSigner to get first wallet and public key.
        // Currently only first address is supported.
        const offlineSigner = await window.keplr.getOfflineSigner(chainId);
        const keplrAccounts = await offlineSigner.getAccounts();
  
        // Set state value as first address.
        setWalletAddress(keplrAccounts[0].address);
        setWalletClient(offlineSigner)
  
      } else {
        alert("Keplr extension is not installed.");
      }
    }, []);
  
    const disconnect = useCallback(() => {
      setWalletAddress(undefined);
      setWalletClient(null)
    }, []);
  
    const contextValue = useMemo(
      () => ({
        connect,
        disconnect,
        chainId,
        kimaAddress,
        kimaSignerClient
      }),
      [
        connect,
        disconnect,
        chainId,
        kimaAddress,
        kimaSignerClient
      ]
    );
    return (
      <KimaProviderContext.Provider value={contextValue}>
        {children}
      </KimaProviderContext.Provider>
    );
  };
  
  export const useKimaProvider = () => {
    return useContext(KimaProviderContext);
  };
  