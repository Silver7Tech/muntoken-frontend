import {
  assertIsDeliverTxSuccess,
} from '@cosmjs/stargate'

import {
  selectTransferSourceChain,
  selectSourceWalletAddress,
  selectTransferTargetChain,
  selectTransferTargetAddressHex,
  selectTransferAmount,
} from "../store/selectors";

import { useSelector } from "react-redux";
import { useCallback, useMemo, useState } from "react";
import { MsgRequestTransaction } from "../diversifi-sdk/tx";
import { ChainID } from '@certusone/wormhole-sdk/lib/cjs/proto/publicrpc/v1/publicrpc';
import { TxClient, MissingWalletError, CalcFee} from "./common"
import { useKimaProvider } from "../contexts/KimaProviderContext"

export default function useRequestTransaction() {
  const [transactionResult, setTransactionResult] = useState("");
  const [txRequesting, setTxRequesting] = useState(false);

  const sourceChain = useSelector(selectTransferSourceChain);
  const sourceAmount = useSelector(selectTransferAmount);
  const sourceWalletAddress = useSelector(selectSourceWalletAddress);

  const targetChain = useSelector(selectTransferTargetChain);
  const targetAddressHex = useSelector(selectTransferTargetAddressHex);
  const serviceFee = CalcFee();
  const {
    kimaSignerClient, kimaAddress
  } = useKimaProvider();

  const sendMsgRequestTransaction = async (fee = [], memo = '') => {
    try {
      const wallet = kimaSignerClient;
      if (!kimaAddress) {
        return;
      }

      const client = await TxClient(wallet);
      const [firstAccount] = await wallet.getAccounts();

      let oChain = "Solana";
      if (sourceChain == ChainID.CHAIN_ID_ETHEREUM) {
        oChain = "Ethereum"
      } else if (sourceChain == ChainID.CHAIN_ID_POLYGON) {
        oChain = "Polygon"
      }

      let tChain = "Solana"
      if (targetChain == ChainID.CHAIN_ID_ETHEREUM) {
        tChain = "Ethereum"
      } else if (targetChain == ChainID.CHAIN_ID_POLYGON) {
        tChain = "Polygon"
      }

      const value: MsgRequestTransaction = {
        creator: firstAccount.address,
        originChain: oChain,
        originAddress: sourceWalletAddress as string,
        targetChain: tChain,
        targetAddress: targetAddressHex as string,
        amount: sourceAmount,
        fee: "" + serviceFee,
      };

      const msg = await client.msgRequestTransaction(value)
      const result = await client.signAndBroadcast([msg], { fee: { amount: fee, gas: "200000" }, memo })
      console.log(result.rawLog);

      return result.rawLog
    } catch (e: any) {
      if (e == MissingWalletError) {
        console.log('TxClient:MsgRequestTransaction:Init Could not initialize signing client. Wallet is required.')
      } else {
        console.log('TxClient:MsgRequestTransaction:Send Could not broadcast Tx: ' + e.message)
      }

      return e.message
    }
  }

  const handleRequestTransaction = useCallback(async () => {
    setTxRequesting(true)
    const result = await sendMsgRequestTransaction();
    assertIsDeliverTxSuccess(result);
    setTransactionResult(result);
    setTxRequesting(false)
  }, [transactionResult]);

  return useMemo(
    () => ({
      txRequesting, transactionResult, handleTransaction: handleRequestTransaction
    }),
    [
      txRequesting, transactionResult, handleRequestTransaction
    ]
  );
}

