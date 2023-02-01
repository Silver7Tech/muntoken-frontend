import { useEffect, useMemo, useState } from "react";

export default function useGasFee() {
  const [ethereumGasFee, setEthereumGasFee] = useState("");
  const [solanaGasFee, setSolanaGasFee] = useState("");
  const [polygonGasFee, setPolygonGasFee] = useState("");

  let interval: any;

  // const Diversifi_Node1 = "18.234.18.234"
  const Diversifi_Node1 = process.env.REACT_APP_Diversifi_Node_Provider1_Query;

  const fetchGasFee = async () => {
    fetch(
      "https://" +
        Diversifi_Node1 +
        "/Diversifi-Technologies/diversifi/diversifi/gas_fee",
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
        setSolanaGasFee("0");
        setEthereumGasFee("0");
        setPolygonGasFee("0");
        data.gasFee.forEach((f:any) => {
          if (f.chainId == "Solana") {
            setSolanaGasFee("" + parseFloat(f.fee));
          } 

          if (f.chainId == "Ethereum") {
            setEthereumGasFee("" + parseFloat(f.fee));
          }

          if (f.chainId == "Polygon") {
            setPolygonGasFee("" + parseFloat(f.fee));
          }
        }); 
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchGasFee();
    if (interval != undefined) {
      clearInterval(interval);
    }
    interval = setInterval(() => {
      fetchGasFee();
    }, 20000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return useMemo(
    () => ({
      solanaGasFee,
      ethereumGasFee,
      polygonGasFee,
    }),
    [solanaGasFee, ethereumGasFee, polygonGasFee]
  );
}
