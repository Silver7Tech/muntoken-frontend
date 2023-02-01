import { useEffect, useMemo, useState } from "react";

export default function useTransactionData() {
  const [txData, setTxData] = useState([]);

  // const Diversifi_Node1 = "18.234.18.234"
  const Diversifi_Node1 = process.env.REACT_APP_Diversifi_Node_Provider1_Query;
  const fetchTxData = async () => {
    fetch(
      "https://" +
        Diversifi_Node1 +
        "/Diversifi-Technologies/diversifi/diversifi/transaction_data",
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
        const result = data.transactionData.map((tx: any) => {
          const item = {
            index: tx.index,
            confirmedBlockHash: tx.confirmedBlockHash,
            creator: tx.creator,
            content:
              "From " +
              tx.originChain +
              " " +
              tx.originAddress +
              " To " +
              tx.targetChain +
              " " +
              tx.targetAddress,
            amount: tx.amount + " USDK",
            fee: tx.fee + " USDK",
            status: tx.status,
            time: tx.time,
          };

          return item
        });

        setTxData(result);
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) {
      fetchTxData();
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return txData;
}
