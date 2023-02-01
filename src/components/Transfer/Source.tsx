import {
  CHAIN_ID_SOLANA,
} from "@certusone/wormhole-sdk";
import { makeStyles, Typography } from "@material-ui/core";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import { Alert } from "@material-ui/lab";
import {
  selectTransferAmount,
  selectTransferShouldLockFields,
  selectTransferSourceBalanceString,
  selectTransferSourceChain,
  selectTransferSourceError,
  selectTransferSourceParsedTokenAccount,
  selectTransferTargetChain,
} from "../../store/selectors";
import {
  incrementStep,
  setAmount,
  setSourceChain,
  setTargetChain,
  setSourceWalletAddress,
} from "../../store/transferSlice";

import {
  CHAINS,
  CLUSTER,
} from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelect from "../ChainSelect";
import ChainSelectArrow from "../ChainSelectArrow";
import KeyAndBalance from "../KeyAndBalance";
import LowBalanceWarning from "../LowBalanceWarning";
import NumberTextField from "../NumberTextField";
import SolanaTPSWarning from "../SolanaTPSWarning";
import StepDescription from "../StepDescription";
import SourceAssetWarning from "./SourceAssetWarning";
import ChainWarningMessage from "../ChainWarningMessage";
import useGetSourceParsedTokens from "../../hooks/useGetSourceParsedTokenAccounts"
import usePoolBalance from "../../diversifi/usePoolBalance"
import { useSnackbar } from "notistack";

const useStyles = makeStyles((theme) => ({
  chainSelectWrapper: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  chainSelectContainer: {
    flexBasis: "100%",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  chainSelectArrow: {
    position: "relative",
    top: "12px",
    [theme.breakpoints.down("sm")]: { transform: "rotate(90deg)" },
  },
  transferField: {
    marginTop: theme.spacing(5),
  },
}));

function Source() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const sourceChain = useSelector(selectTransferSourceChain);
  const targetChain = useSelector(selectTransferTargetChain);
  const targetChainOptions = useMemo(
    () => CHAINS.filter((c) => c.id !== sourceChain),
    [sourceChain]
  );

  const parsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );

  const uiAmountString = useSelector(selectTransferSourceBalanceString);
  const amount = useSelector(selectTransferAmount);
  const error = useSelector(selectTransferSourceError);
  const shouldLockFields = useSelector(selectTransferShouldLockFields);
  const { isReady, statusMessage, walletAddress } = useIsWalletReady(sourceChain);
  const maps = useGetSourceParsedTokens(false);

  const { enqueueSnackbar } = useSnackbar();

  const handleSourceChange = useCallback(
    (event: any) => {
      dispatch(setSourceChain(event.target.value));
    },
    [dispatch]
  );
  const handleTargetChange = useCallback(
    (event: any) => {
      dispatch(setTargetChain(event.target.value));
    },
    [dispatch]
  );
  const handleAmountChange = useCallback(
    (event: any) => {
      dispatch(setAmount(event.target.value));
    },
    [dispatch]
  );
  const handleMaxClick = useCallback(() => {
    if (uiAmountString) {
      dispatch(setAmount(uiAmountString));
    }
  }, [dispatch, uiAmountString]);
  
  const {
    solanaBalance, ethereumBalance, polygonBalance
  } = usePoolBalance();
 
  const handleNextClick = useCallback(() => {
    if (walletAddress) {

      if (targetChain == 1 && +solanaBalance < +amount 
        || targetChain == 2 && +ethereumBalance < +amount
        || targetChain == 3 && +polygonBalance < +amount) {
        // Show notification
        enqueueSnackbar(null, {
          content: <Alert severity="error">Targeted pool doens't have enough balance in it.</Alert>,
        });
        return;
      }

      dispatch(incrementStep());
      dispatch(setSourceWalletAddress(walletAddress));
    }
  }, [dispatch, walletAddress, amount, sourceChain, ethereumBalance, solanaBalance, polygonBalance]);

  return (
    <>
      <StepDescription>
        <div style={{ display: "flex", alignItems: "center" }}>
          Select tokens to send through the Kima protocol.
          <div style={{ flexGrow: 1 }} />
          <div>
          </div>
        </div>
      </StepDescription>
      <div
        className={classes.chainSelectWrapper}
        style={{ marginBottom: "25px" }}
      >
        <div className={classes.chainSelectContainer}>
          <Typography variant="caption">Origin</Typography>
          <ChainSelect
            select
            variant="outlined"
            fullWidth
            value={sourceChain}
            onChange={handleSourceChange}
            disabled={shouldLockFields}
            chains={CHAINS}
          />
        </div>
        <div className={classes.chainSelectArrow}>
          <ChainSelectArrow
            onClick={() => {
              dispatch(setSourceChain(targetChain));
            }}
            disabled={shouldLockFields}
          />
        </div>
        <div className={classes.chainSelectContainer}>
          <Typography variant="caption">Target</Typography>
          <ChainSelect
            variant="outlined"
            select
            fullWidth
            value={targetChain}
            onChange={handleTargetChange}
            disabled={shouldLockFields}
            chains={targetChainOptions}
          />
        </div>
      </div>
      <KeyAndBalance chainId={sourceChain} />

      {/* {isReady || uiAmountString ? (
        <div className={classes.transferField}>
          <TokenSelector disabled={shouldLockFields} />
        </div>
      ) : null} */}

      <>
        <LowBalanceWarning chainId={sourceChain} />
        {sourceChain === CHAIN_ID_SOLANA && CLUSTER === "mainnet" && (
          <SolanaTPSWarning />
        )}
        <SourceAssetWarning
          sourceChain={sourceChain}
          sourceAsset={parsedTokenAccount?.mintKey}
        />

        <NumberTextField
          variant="outlined"
          label="Amount"
          fullWidth
          className={classes.transferField}
          value={amount}
          onChange={handleAmountChange}
          disabled={shouldLockFields}
          onMaxClick={
            uiAmountString ? handleMaxClick : undefined
          }
        />
        
        <ChainWarningMessage chainId={sourceChain} />
        <ChainWarningMessage chainId={targetChain} />
        <ButtonWithLoader
          disabled={ !isReady || amount.length === 0}
          onClick={handleNextClick}
          showLoader={false}
          error={statusMessage}
        >
          Next
        </ButtonWithLoader>
      </>
    </>
  );
}

export default Source;
