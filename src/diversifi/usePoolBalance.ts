import { useEffect, useMemo, useState } from "react";

export default function usePoolBalance() {
  const [ethereumBalance, setEthereumBalance] = useState("");
  const [solanaBalance, setSolanaBalance] = useState("");
  const [polygonBalance, setPolygonBalance] = useState("");

  let interval: any;

  // const Diversifi_Node1 = "18.234.18.234"
  const Diversifi_Node1 = process.env.REACT_APP_Diversifi_Node_Provider1_Query;

  const fetchBalance = async () => {
    fetch(
      "https://" +
        Diversifi_Node1 +
        "/Diversifi-Technologies/diversifi/diversifi/pool_balance",
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
        setEthereumBalance("" + parseFloat(data.poolBalance[0].balance));
        setSolanaBalance("" + parseFloat(data.poolBalance[1].balance));
        setPolygonBalance("" + parseFloat(data.poolBalance[2].balance));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchBalance();
    if (interval != undefined) {
      clearInterval(interval);
    }
    interval = setInterval(() => {
      fetchBalance();
    }, 2500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return useMemo(
    () => ({
      solanaBalance,
      ethereumBalance,
      polygonBalance,
    }),
    [solanaBalance, ethereumBalance, polygonBalance]
  );
}
