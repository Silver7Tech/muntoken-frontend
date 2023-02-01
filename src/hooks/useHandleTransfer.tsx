import {
  ChainId,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
  getEmitterAddressTerra,
  isEVMChain,
  parseSequenceFromLogTerra,
  transferFromTerra,
  uint8ArrayToHex,
} from "@certusone/wormhole-sdk";
import { Alert } from "@material-ui/lab";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import {
  Connection,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  ConnectedWallet,
  useConnectedWallet,
} from "@terra-money/wallet-provider";
import { Signer, ethers, utils } from "ethers";
import { parseUnits, zeroPad } from "ethers/lib/utils";
import { useSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import {
  selectTerraFeeDenom,
  selectTransferAmount,
  selectTransferIsSendComplete,
  selectTransferIsSending,
  selectTransferIsTargetComplete,
  selectTransferOriginAsset,
  selectTransferOriginChain,
  selectTransferRelayerFee,
  selectTransferSourceAsset,
  selectTransferSourceChain,
  selectTransferSourceParsedTokenAccount,
  selectTransferTargetChain,
} from "../store/selectors";
import { setIsSending, setTransferTx } from "../store/transferSlice";
import { TERRA_TOKEN_BRIDGE_ADDRESS } from "../utils/consts";

import parseError from "../utils/parseError";
import { postWithFees, waitForTerraExecution } from "../utils/terra";
import useTransferTargetAddressHex from "./useTransferTargetAddress";
import erc20ABI from "../diversifi/ethereum/erc20ABI.json";
import { StandardToken } from "../diversifi/ethereum/erc20Token";

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getOrCreateAssociatedTokenAccount } from "../diversifi/solana/getOrCreateAssociatedTokenAccount";
import { createApproveTransferInstruction, createTransferInstruction } from "../diversifi/solana/createTransferInstruction";
import { CalcFee } from "../diversifi/common"

async function evm(
  dispatch: any,
  enqueueSnackbar: any,
  signer: Signer,
  tokenAddress: string,
  decimals: number,
  amount: string,
  serviceFee: number,
): Promise<boolean> {
  const { ethereum } = window as any;
  const provider = new ethers.providers.Web3Provider(ethereum);

  if (provider !== undefined) {
    const contract = new ethers.Contract(
      tokenAddress,
      erc20ABI.abi,
      signer
    ) as StandardToken;

    dispatch(setIsSending(true));

    try {
      //-----------------------------------
      // Step 1, Approve token transfer from user wallet to ethereum pool
      //-----------------------------------
      const baseAmountParsed = parseUnits(amount, decimals);

      // Ethereum Pool Address
      const toAddress = process.env.REACT_APP_ETHEREUM_POOL_ADDRESS as string;
      // function approve(address spender, uint256 amount) external returns (bool);

      const transaction = await contract.transfer(toAddress, baseAmountParsed);
      // Wait for the transaction to be mined...
      const transaction_info = await transaction.wait();
      console.log(`[Success] Transaction Hash: ${transaction_info.blockHash}`);

      dispatch(
        setTransferTx({
          id: transaction_info.transactionHash,
          block: transaction_info.blockNumber,
        })
      );
      enqueueSnackbar(null, {
        content: <Alert severity="success">Transaction approved</Alert>,
      });
      //-----------------------------------
      // Step 2, Check diversifi if the transaction is actually made
      //-----------------------------------

      //-----------------------------------
      // Step 3, Transfer the same amount of USDC on Targeted Chain to the user wallet
      //-----------------------------------

      // enqueueSnackbar(null, {
      //   content: <Alert severity="info">Fetching VAA</Alert>,
      // });

      // enqueueSnackbar(null, {
      //   content: <Alert severity="success">Fetched Signed VAA</Alert>,
      // });
      return true;
    } catch (e) {
      console.error(e);
      enqueueSnackbar(null, {
        content: <Alert severity="error">{parseError(e)}</Alert>,
      });

      return false;
    }
  } else {
    enqueueSnackbar(null, {
      content: <Alert severity="error">No provider!</Alert>,
    });

    return false;
  }
}

async function solana(
  dispatch: any,
  enqueueSnackbar: any,
  connection: any,
  publicKey: PublicKey,
  signTransaction: any,
  payerAddress: string, //TODO: we may not need this since we have wallet
  amount: string,
  decimals: number,
  serviceFee: number,
): Promise<boolean> {
  const poolAddress = process.env.REACT_APP_SOLANA_POOL_ADDRESS as string;
  if (!poolAddress || !amount) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">Invalid amount</Alert>,
    });

    return false;
  }

  dispatch(setIsSending(true));
  try {
    //--------------------------------
    // Step  1. Token transfer from user's wallet to the pool account.
    //--------------------------------
    const amountParsed = parseUnits(amount, decimals).toNumber();

    if (!payerAddress || !signTransaction) {
      enqueueSnackbar(null, {
        content: <Alert severity="error">Wallet not connected!</Alert>,
      });

      dispatch(setIsSending(false));
      return false;
    }

    const USDC_Token = process.env
      .REACT_APP_Solana_USDC_Token_Address as string;
    const mint = new PublicKey(USDC_Token);
    const toPublicKey = new PublicKey(poolAddress);

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      publicKey as PublicKey,
      mint,
      publicKey as PublicKey,
      signTransaction
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      publicKey as PublicKey,
      mint,
      toPublicKey,
      signTransaction
    );

    const transaction = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount.address, // source
        toTokenAccount.address, // dest
        publicKey as PublicKey,
        amountParsed, // amount * LAMPORTS_PER_SOL,
        [],
        TOKEN_PROGRAM_ID
      )     
    );

    const blockHash = await connection.getLatestBlockhash();
    transaction.feePayer = publicKey as PublicKey;
    transaction.recentBlockhash = await blockHash.blockhash;
    const signed = await signTransaction(transaction);
    
    const info = await connection.sendRawTransaction(signed.serialize());

    dispatch(setTransferTx({ id: info, block: signed.recentBlockhash }));
    
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction is approved</Alert>,
    });

    // if (!info) {
    //   return false;
    // }

    // -------------------------------------------
    // Step 2 Verify token transfer from diversifi
    // -------------------------------------------

    return true;
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });

    return false;
  }
}

async function terra(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: ConnectedWallet,
  asset: string,
  amount: string,
  decimals: number,
  targetChain: ChainId,
  targetAddress: Uint8Array,
  feeDenom: string,
  relayerFee?: string
): Promise<boolean> {
  dispatch(setIsSending(true));
  try {
    const baseAmountParsed = parseUnits(amount, decimals);
    const feeParsed = parseUnits(relayerFee || "0", decimals);
    const transferAmountParsed = baseAmountParsed.add(feeParsed);
    const msgs = await transferFromTerra(
      wallet.terraAddress,
      TERRA_TOKEN_BRIDGE_ADDRESS,
      asset,
      transferAmountParsed.toString(),
      targetChain,
      targetAddress,
      feeParsed.toString()
    );

    const result = await postWithFees(
      wallet,
      msgs,
      "Wormhole - Initiate Transfer",
      [feeDenom]
    );

    const info = await waitForTerraExecution(result);
    dispatch(setTransferTx({ id: info.txhash, block: info.height }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const sequence = parseSequenceFromLogTerra(info);
    if (!sequence) {
      throw new Error("Sequence not found");
    }
    const emitterAddress = await getEmitterAddressTerra(
      TERRA_TOKEN_BRIDGE_ADDRESS
    );
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });

    return true;
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));

    return false;
  }
}

export function useHandleTransfer() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const sourceChain = useSelector(selectTransferSourceChain);
  const sourceAsset = useSelector(selectTransferSourceAsset);
  const originChain = useSelector(selectTransferOriginChain);
  const originAsset = useSelector(selectTransferOriginAsset);
  const amount = useSelector(selectTransferAmount);
  const targetChain = useSelector(selectTransferTargetChain);
  const targetAddress = useTransferTargetAddressHex();
  const isTargetComplete = useSelector(selectTransferIsTargetComplete);
  const isSending = useSelector(selectTransferIsSending);
  const isSendComplete = useSelector(selectTransferIsSendComplete);
  const { signer } = useEthereumProvider();
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const terraWallet = useConnectedWallet();
  const terraFeeDenom = useSelector(selectTerraFeeDenom);
  const sourceParsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const relayerFee = useSelector(selectTransferRelayerFee);
  const sourceTokenPublicKey = sourceParsedTokenAccount?.publicKey;
  const decimals = sourceParsedTokenAccount?.decimals;
  const isNative = sourceParsedTokenAccount?.isNativeAsset || false;
  const disabled = !isTargetComplete || isSending || isSendComplete;

  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const serviceFee = CalcFee();

  const processApprove = async () => {
    const bytes: Uint8Array = new Uint8Array();
    enqueueSnackbar(null, {
      content: <Alert severity="success">Kimachain is working to complete transfer. Please wait for a few seconds...</Alert>,
    });

    dispatch(setIsSending(false));
  };

  const handleTransferClick = useCallback(async () => {
    // TODO: we should separate state for transaction vs fetching vaa
    let walletTransferred = false;
    if (
      isEVMChain(sourceChain) &&
      !!signer &&
      !!sourceAsset &&
      decimals !== undefined &&
      !!targetAddress
    ) {
      walletTransferred = await evm(
        dispatch,
        enqueueSnackbar,
        signer,
        sourceAsset,
        decimals,
        amount,
        serviceFee,
      );
    } else if (
      sourceChain === CHAIN_ID_SOLANA &&
      !!solanaWallet &&
      !!solPK &&
      !!sourceAsset &&
      !!sourceTokenPublicKey &&
      !!targetAddress &&
      decimals !== undefined
    ) {
      walletTransferred = await solana(
        dispatch,
        enqueueSnackbar,
        connection,
        publicKey as PublicKey,
        signTransaction,
        solPK.toString(),
        amount,
        decimals,
        serviceFee,
      );
    } else if (
      sourceChain === CHAIN_ID_TERRA &&
      !!terraWallet &&
      !!sourceAsset &&
      decimals !== undefined &&
      !!targetAddress
    ) {
      walletTransferred = await terra(
        dispatch,
        enqueueSnackbar,
        terraWallet,
        sourceAsset,
        amount,
        decimals,
        targetChain,
        targetAddress,
        terraFeeDenom,
        relayerFee
      );
    } else {
    }

    // If the token transfer fails or user cancells transfer
    if (!walletTransferred) {
      dispatch(setIsSending(false));
      return;
    }

    // Process
    setTimeout(() => {
      processApprove();
    }, 500);
  }, [
    dispatch,
    enqueueSnackbar,
    sourceChain,
    signer,
    relayerFee,
    solanaWallet,
    solPK,
    terraWallet,
    sourceTokenPublicKey,
    sourceAsset,
    amount,
    decimals,
    targetChain,
    targetAddress,
    originAsset,
    originChain,
    isNative,
    terraFeeDenom,
  ]);
  return useMemo(
    () => ({
      handleClick: handleTransferClick,
      disabled,
      showLoader: isSending,
    }),
    [handleTransferClick, disabled, isSending]
  );
}
