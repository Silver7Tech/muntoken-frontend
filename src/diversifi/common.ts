import { SigningStargateClient, StdFee } from "@cosmjs/stargate";

import {
  Registry,
  DirectSecp256k1HdWallet,
  OfflineSigner,
  EncodeObject,
} from "@cosmjs/proto-signing";
import {
  MsgRequestTransaction,
  MsgApproveTransaction,
  MsgFetchBalance,
} from "../diversifi-sdk/tx";

import { useSelector } from "react-redux";
import {
  selectTransferAmount,
  selectTransferOriginChain,
  selectTransferSourceChain,
  selectTransferTargetChain,
} from "../store/selectors";

import useGasFee from "../diversifi/useGasFee"
import { ChainID } from "@certusone/wormhole-sdk/lib/cjs/proto/publicrpc/v1/publicrpc";

interface TxClientOptions {
  addr: string;
}

const defaultFee = {
  amount: [],
  gas: "200000",
};

interface SignAndBroadcastOptions {
  fee: StdFee;
  memo?: string;
}

const types = [
  [
    "/DiversifiTechnologies.diversifi.diversifi.MsgRequestTransaction",
    MsgRequestTransaction,
  ],
  [
    "/DiversifiTechnologies.diversifi.diversifi.MsgApproveTransaction",
    MsgApproveTransaction,
  ],
  [
    "/DiversifiTechnologies.diversifi.diversifi.MsgFetchBalance",
    MsgFetchBalance,
  ],
];

// export const Diversifi_Node1 = "18.234.18.234"
export const Diversifi_Node1 = process.env.REACT_APP_Diversifi_Node_Provider1;

export const MissingWalletError = new Error("wallet is required");
export const registry = new Registry(<any>types);


export const CalcFee = () => {
  const sendAmount = useSelector(selectTransferAmount);

  if (+sendAmount < 10 ) return 1;
  if (+sendAmount < 100 ) return 2;
  if (+sendAmount < 500 ) return 5;

  return 10;
}

export const CalcGasFee = () => {
  const originChain = useSelector(selectTransferSourceChain);
  const targetChain = useSelector(selectTransferTargetChain);
  const {
    solanaGasFee, ethereumGasFee, polygonGasFee
  } = useGasFee();
  const max_gas = 200000;

  let OriginFee = "Solana: " + solanaGasFee + " SOL"
  if (originChain == ChainID.CHAIN_ID_ETHEREUM) {
    OriginFee = "Ethereum: " + ((+ethereumGasFee) * max_gas/1e9) + "ETH"
  } else if (originChain == ChainID.CHAIN_ID_POLYGON) {
    OriginFee = "Polygon: " + ((+polygonGasFee) * max_gas/1e9) + "MATIC"
  }

  let TargetFee = "Solana: " + solanaGasFee + " SOL"
  if (targetChain == ChainID.CHAIN_ID_ETHEREUM) {
    TargetFee = "Ethereum: " + ((+ethereumGasFee) * max_gas/1e9) + "ETH"
  } else if (targetChain == ChainID.CHAIN_ID_POLYGON) {
    TargetFee = "Polygon: " + ((+polygonGasFee) * max_gas/1e9) + "MATIC"
  }

  return [OriginFee, TargetFee];
}

export const TxClient = async (
  wallet: OfflineSigner,
  { addr: addr }: TxClientOptions = { addr: "https://" + Diversifi_Node1 }
) => {
  if (!wallet) throw MissingWalletError;
  let client: any;
  if (addr) {
    client = await SigningStargateClient.connectWithSigner(addr, wallet, {
      registry,
    });
  } else {
    client = await SigningStargateClient.offline(wallet, { registry });
  }
  const { address } = (await wallet.getAccounts())[0];

  return {
    signAndBroadcast: (
      msgs: EncodeObject[],
      { fee, memo }: SignAndBroadcastOptions = { fee: defaultFee, memo: "" }
    ) => client.signAndBroadcast(address, msgs, fee, memo),
    msgRequestTransaction: (data: MsgRequestTransaction): EncodeObject => ({
      typeUrl:
        "/DiversifiTechnologies.diversifi.diversifi.MsgRequestTransaction",
      value: MsgRequestTransaction.fromPartial(data),
    }),
    msgApproveTransaction: (data: MsgApproveTransaction): EncodeObject => ({
      typeUrl:
        "/DiversifiTechnologies.diversifi.diversifi.MsgApproveTransaction",
      value: MsgApproveTransaction.fromPartial(data),
    }),
    msgFetchBalance: (data: MsgFetchBalance): EncodeObject => ({
      typeUrl: "/DiversifiTechnologies.diversifi.diversifi.MsgFetchBalance",
      value: MsgFetchBalance.fromPartial(data),
    }),
  };
};
