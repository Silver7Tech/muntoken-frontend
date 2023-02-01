import { Typography } from "@material-ui/core";
import {
  Container,
  Step,
  StepButton,
  StepContent,
  Stepper,
} from "@material-ui/core";
import useAccountBalance from "../../diversifi/useAccountBalance"
import KimaWalletKey from "../KimaWalletKey";

function Wallet() {
  const { balance, walletAddress } = useAccountBalance();

  return (
    <Container maxWidth="md">
      <Stepper activeStep={0} orientation="vertical">
        <Step
          expanded={true}
        >
          <StepButton icon={null}>
            Kima Account
          </StepButton>
          <StepContent>
            <KimaWalletKey/>
          </StepContent>
        </Step>
      </Stepper>
    </Container>
  );
}

export default Wallet;
