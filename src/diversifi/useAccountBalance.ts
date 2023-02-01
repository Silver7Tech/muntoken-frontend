import { useEffect, useMemo, useState } from "react";
import { useKimaProvider } from "../contexts/KimaProviderContext"
import { useSnackbar } from "notistack";

export default function useAccountBalance() {
  const [balance, setBalance] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const {
    kimaSignerClient
  } = useKimaProvider();
  const { enqueueSnackbar } = useSnackbar();

  // const Diversifi_Node1 = "18.234.18.234"
  const Diversifi_Node1 = process.env.REACT_APP_Diversifi_Node_Provider1_Query;
  const fetchBalance = async () => {
    const wallet = kimaSignerClient;
    if (!wallet) {
      return;
    }

    const { address } = (await wallet.getAccounts())[0];

    // set wallet address
    setWalletAddress(address);

    fetch(
      "https://" + Diversifi_Node1 + "/cosmos/bank/v1beta1/balances/" + address,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        // set balance
        setBalance("" + parseFloat(data.balances[0].amount) / 1e9 + " KMA");
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    fetchBalance();
  }, [setBalance, setWalletAddress, balance, walletAddress]);

  return useMemo(
    () => ({
      balance,
      walletAddress,
    }),
    [balance, walletAddress]
  );
}
