import { CHAIN_ID_SOLANA, isEVMChain } from "@certusone/wormhole-sdk";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@material-ui/core";
import { ArrowDownward } from "@material-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectTransferAmount,
  selectTransferOriginChain,
  selectTransferSourceChain,
  selectTransferSourceParsedTokenAccount,
} from "../../store/selectors";
import { CHAINS_BY_ID, CLUSTER, MULTI_CHAIN_TOKENS } from "../../utils/consts";
import SmartAddress from "../SmartAddress";
import SolanaTPSWarning from "../SolanaTPSWarning";
import { useTargetInfo } from "./Target";
import TokenWarning from "./TokenWarning";
import { CalcFee, CalcGasFee } from "../../diversifi/common"

function SendConfirmationContent({
  open,
  onClose,
  onClick,
}: {
  open: boolean;
  onClose: () => void;
  onClick: () => void;
}) {
  const sourceChain = useSelector(selectTransferSourceChain);
  const sourceParsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const { targetChain, targetAsset } = useTargetInfo();
  const originChain = useSelector(selectTransferOriginChain);
  const sendAmount = useSelector(selectTransferAmount);

  //TODO this check is essentially duplicated.
  const deservesTimeout = useMemo(() => {
    if (originChain && sourceParsedTokenAccount?.mintKey) {
      const searchableAddress = isEVMChain(originChain)
        ? sourceParsedTokenAccount.mintKey.toLowerCase()
        : sourceParsedTokenAccount.mintKey;
      return (
        originChain !== targetChain &&
        !!MULTI_CHAIN_TOKENS[sourceChain]?.[searchableAddress]
      );
    } else {
      return false;
    }
  }, [originChain, targetChain, sourceChain, sourceParsedTokenAccount]);
  const timeoutDuration = 5;

  const [countdown, setCountdown] = useState(
    deservesTimeout ? timeoutDuration : 0
  );

  useEffect(() => {
    if (!deservesTimeout || countdown === 0) {
      return;
    }
    let cancelled = false;

    setInterval(() => {
      if (!cancelled) {
        setCountdown((state) => state - 1);
      }
    }, 1000);

    return () => {
      cancelled = true;
    };
  }, [deservesTimeout, countdown]);

  useEffect(() => {
    if (open && deservesTimeout) {
      //Countdown starts on mount, but we actually want it to start on open
      setCountdown(timeoutDuration);
    }
  }, [open, deservesTimeout]);

  const sendConfirmationContent = (
    <>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogContent>
        {(
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Typography variant="subtitle1" style={{ marginBottom: 8 }}>
              You are about to perform this transfer:
            </Typography>
            <SmartAddress
              variant="h6"
              chainId={sourceChain}
              parsedTokenAccount={sourceParsedTokenAccount}
            />
            <div>
              <Typography variant="caption">
                {CHAINS_BY_ID[sourceChain].name}
              </Typography>
            </div>
            <div style={{ paddingTop: 4 }}>
              <ArrowDownward fontSize="inherit" />
            </div>
            <div>
              <Typography variant="caption">
                {CHAINS_BY_ID[targetChain].name}
              </Typography>
            </div>
          </div>
        )}
        <TokenWarning
          sourceAsset={sourceParsedTokenAccount?.mintKey}
          sourceChain={sourceChain}
          originChain={originChain}
          targetAsset={targetAsset ?? undefined}
          targetChain={targetChain}
        />

        <Typography variant="subtitle1" style={{ marginBottom: 8 }}>
          Expected gas fees at max (Assumed 200000 gas)
        </Typography>

        <Typography variant="subtitle1" style={{ marginBottom: 8 }}>
          {CalcGasFee()[0]} +
        </Typography>

        <Typography variant="subtitle1" style={{ marginBottom: 8 }}>
          {CalcGasFee()[1]}
        </Typography>

        <Typography variant="subtitle1" style={{ marginBottom: 8 }}>
          You will receive {+sendAmount - CalcFee()} USDK ({CalcFee()} USDK - service fee).
        </Typography>

        {sourceChain === CHAIN_ID_SOLANA && CLUSTER === "mainnet" && (
          <SolanaTPSWarning />
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onClick}
          size={"medium"}
          disabled={!!countdown}
        >
          {!!countdown ? countdown.toString() : "Confirm"}
        </Button>
      </DialogActions>
    </>
  );

  return sendConfirmationContent;
}

export default function SendConfirmationDialog({
  open,
  onClick,
  onClose,
}: {
  open: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <SendConfirmationContent
        open={open}
        onClose={onClose}
        onClick={onClick}
      />
    </Dialog>
  );
}
