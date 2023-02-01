import {
  assertIsDeliverTxSuccess,
} from '@cosmjs/stargate'

import { useEffect, useMemo, useState } from "react";
import { MsgFetchBalance } from "../diversifi-sdk/tx";
import { TxClient, MissingWalletError, } from "./common"
import { useKimaProvider } from "../contexts/KimaProviderContext"

export default function useFetchBalance() {
  const [balanceResult, setBalanceResult] = useState("");
  const [txRequesting, setTxRequesting] = useState(false);
  const {
    kimaSignerClient
  } = useKimaProvider();

  const sendMsgFetchTransaction = async (fee = [], memo = '') => {
    try {
      const wallet = kimaSignerClient;
      if (!wallet) {
        return;
      }

      const client = await TxClient(wallet);
      const [firstAccount] = await wallet.getAccounts();

      const value: MsgFetchBalance = {
        creator: firstAccount.address,
      };

      const msg = await client.msgFetchBalance(value)
      const result = await client.signAndBroadcast([msg], { fee: { amount: fee, gas: "200000" }, memo })

      return result.rawLog
    } catch (e: any) {
      if (e == MissingWalletError) {
        console.log('TxClient:MsgFetchBalance:Init Could not initialize signing client. Wallet is required.')
      } else {
        console.log('TxClient:MsgFetchBalance:Send Could not broadcast Tx: ' + e.message)
      }

      return e.message
    }
  }

  useEffect(() => {
    const interval = setInterval(()=>{
      handleFetchBalance()
    }, 10000)
       
    return() => {clearInterval(interval);}
  }, [balanceResult, txRequesting]);

  const handleFetchBalance = async () => {
    setTxRequesting(true)
    const result = await sendMsgFetchTransaction();
    assertIsDeliverTxSuccess(result);
    setBalanceResult(result);
    setTxRequesting(false)
  };

  return useMemo(
    () => ({
      txRequesting, balanceResult
    }),
    [
      txRequesting, balanceResult
    ]
  );
}

