import ToggleConnectedButton from "./ToggleConnectedButton";
import { useKimaProvider } from "../contexts/KimaProviderContext";

const KimaWalletKey = () => {
  const { connect, disconnect, kimaAddress } =
  useKimaProvider();

  return (
    <>
      <ToggleConnectedButton
        connect={connect}
        disconnect={disconnect}
        connected={!!kimaAddress}
        pk={kimaAddress || ""}
      />
    </>
  );
};

export default KimaWalletKey;
