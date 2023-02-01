import { useEffect, useMemo, useState } from "react";

export default function useFeeBalance() {
  const [ethereumFeeBalance, setEthereumFeeBalance] = useState("");
  const [solanaFeeBalance, setSolanaFeeBalance] = useState("");
  const [polygonFeeBalance, setPolygonFeeBalance] = useState("");

  let interval: any;

  // const Diversifi_Node1 = "18.234.18.234"
  const Diversifi_Node1 = process.env.REACT_APP_Diversifi_Node_Provider1_Query;

  const fetchFeeBalance = async () => {
    fetch(
      "https://" +
        Diversifi_Node1 +
        "/kenta-mori3322/diversifi/diversifi/fee_balance",
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
        setSolanaFeeBalance("0");
        setEthereumFeeBalance("0");
        setPolygonFeeBalance("0");
        data.feeBalance.forEach((f:any) => {
          if (f.chainName == "Solana") {
            setSolanaFeeBalance("" + parseFloat(f.balance));
          } 

          if (f.chainName == "Ethereum") {
            setEthereumFeeBalance("" + parseFloat(f.balance));
          }

          if (f.chainName == "Polygon") {
            setPolygonFeeBalance("" + parseFloat(f.balance));
          }
        }); 
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchFeeBalance();
    if (interval != undefined) {
      clearInterval(interval);
    }
    interval = setInterval(() => {
      fetchFeeBalance();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return useMemo(
    () => ({
      solanaFeeBalance,
      ethereumFeeBalance,
      polygonFeeBalance,
    }),
    [solanaFeeBalance, ethereumFeeBalance, polygonFeeBalance]
  );
}
