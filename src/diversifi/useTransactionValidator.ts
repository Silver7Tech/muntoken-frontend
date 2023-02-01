import { useEffect, useMemo, useState } from "react";

export default function useTransactionValidator() {
  const [txData, setTxData] = useState([]);

  // const Diversifi_Node1 = "18.234.18.234"
  const Diversifi_Node1 = process.env.REACT_APP_Diversifi_Node_Provider1_Query;
  const fetchTxData = async () => {
    fetch(
      "https://" +
        Diversifi_Node1 +
        "/cosmos/staking/v1beta1/validators",
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
        const result = data.validators.map((v: any) => {
          const item = {
            moniker: v.description.moniker,
            operator: v.operator_address,
            bond: parseFloat(v.tokens) / 1e9 + ' KMA',
            status: v.status,
            jailed: v.jailed==false ? 'No' : 'Yes',
            commission: parseFloat(v.commission.commission_rates.rate)*100 + ' %',
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
