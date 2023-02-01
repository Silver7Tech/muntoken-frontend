import {
  AppBar,
  Container,
  Link,
  makeStyles,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { useCallback } from "react";
import { useHistory, useLocation } from "react-router";
import {
  Link as RouterLink,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import Footer from "./components/Footer";
import Stats from "./components/Stats";
import Validators from "./components/Validators";
import Transfer from "./components/Transfer";
import Wallet from "./components/Wallet";
import { useBetaContext } from "./contexts/BetaContext";
import Portal from "./images/logo.png"
import Header from "./images/Header.png";
import { CLUSTER } from "./utils/consts";

// import useFetchBalance from "./diversifi/useFetchBalance"

const useStyles = makeStyles((theme) => ({
  appBar: {
    background: "transparent",
    marginTop: theme.spacing(2),
    "& > .MuiToolbar-root": {
      margin: "auto",
      width: "100%",
      maxWidth: 1440,
    },
  },
  spacer: {
    flex: 1,
    width: "100vw",
  },
  link: {
    ...theme.typography.body2,
    fontWeight: 600,
    fontFamily: "Suisse BP Intl, sans-serif",
    color: "black",
    marginLeft: theme.spacing(4),
    textUnderlineOffset: "6px",
    [theme.breakpoints.down("sm")]: {
      marginLeft: theme.spacing(2.5),
    },
    [theme.breakpoints.down("xs")]: {
      marginLeft: theme.spacing(1),
    },
    "&.active": {
      textDecoration: "underline",
    },
  },
  bg: {
    // background:
    //   "linear-gradient(160deg, rgba(69,74,117,.1) 0%, rgba(138,146,178,.1) 33%, rgba(69,74,117,.1) 66%, rgba(98,104,143,.1) 100%), linear-gradient(45deg, rgba(153,69,255,.1) 0%, rgba(121,98,231,.1) 20%, rgba(0,209,140,.1) 100%)",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
  },
  content: {
    margin: theme.spacing(2, 0),
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(4, 0),
    },
  },
  headerImage: {
    position: "absolute",
    zIndex: -1,
    top: 0,
    background: `url(${Header})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "top -500px center",
    backgroundSize: "2070px 1155px",
    width: "100%",
    height: 1155,
  },
  brandLink: {
    display: "inline-flex",
    alignItems: "center",
    "&:hover": {
      textDecoration: "none",
    },
  },
  iconButton: {
    [theme.breakpoints.up("md")]: {
      marginRight: theme.spacing(2.5),
    },
    [theme.breakpoints.down("sm")]: {
      marginRight: theme.spacing(2.5),
    },
    [theme.breakpoints.down("xs")]: {
      marginRight: theme.spacing(1),
    },
  },
  betaBanner: {
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: theme.spacing(1, 0),
  },
  wormholeIcon: {
    height: 68,
    "&:hover": {
      filter: "contrast(1)",
    },
    verticalAlign: "middle",
    marginRight: theme.spacing(1),
    display: "inline-block",
    padding: 5,
  },
  gradientRight: {
    position: "absolute",
    top: "72px",
    right: "-1000px",
    width: "1757px",
    height: "1506px",
    background:
      "radial-gradient(closest-side at 50% 50%, #f9f9f9 0%, #FFCE0000 100%)",
    opacity: "0.2",
    transform: "matrix(0.87, 0.48, -0.48, 0.87, 0, 0)",
    zIndex: "-1",
    pointerEvent: "none",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  gradientLeft: {
    top: "-251px",
    left: "-350px",
    width: "1043px",
    height: "1191px",
    position: "absolute",
    background:
      "radial-gradient(closest-side at 50% 50%, #f9f9f9 0%, #F44B1B00 100%)",
    opacity: "0.2",
    zIndex: "-1",
    pointerEvent: "none",
  },
  gradientLeft2: {
    bottom: "-330px",
    left: "-350px",
    width: "1379px",
    height: "1378px",
    position: "absolute",
    background:
      "radial-gradient(closest-side at 50% 50%, #f9f9f9 0%, #F44B1B00 100%)",
    opacity: "0.2",
    zIndex: "-1",
    pointerEvent: "none",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  gradientRight2: {
    position: "absolute",
    bottom: "-900px",
    right: "-1000px",
    width: "1757px",
    height: "1506px",
    background:
      "radial-gradient(closest-side at 50% 50%, #f9f9f9 0%, #FFCE0000 100%)",
    opacity: "0.24",
    transform: "matrix(0.87, 0.48, -0.48, 0.87, 0, 0);",
    zIndex: "-1",
    pointerEvent: "none",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
}));

function App() {
  const classes = useStyles();
  const isBeta = useBetaContext();
  const { push } = useHistory();
  const { pathname } = useLocation();
  const handleTabChange = useCallback(
    (event, value) => {
      push(value);
    },
    [push]
  );
  // useFetchBalance();
  
  return (
    <div className={classes.bg}>
      <AppBar
        position="static"
        color="inherit"
        className={classes.appBar}
        elevation={0}
      >
        <Toolbar>
          <Link
            component={RouterLink}
            to="/transfer"
            className={classes.brandLink}
          >
            <img src={Portal} alt="Portal" className={classes.wormholeIcon} />
          </Link>
          <div className={classes.spacer} />
        </Toolbar>
      </AppBar>
      {CLUSTER === "mainnet" ? null : (
        <AppBar position="static" className={classes.betaBanner} elevation={0}>
          <Typography style={{ textAlign: "center" }}>
            Caution! This platform is running on {CLUSTER} environment.
          </Typography>
        </AppBar>
      )}
      {isBeta ? (
        <AppBar position="static" className={classes.betaBanner} elevation={0}>
          <Typography style={{ textAlign: "center" }}>
            Caution! You have enabled the beta. Enter the secret code again to
            disable.
          </Typography>
        </AppBar>
      ) : null}
      <div className={classes.content}>
        {["/transfer", "/explorer", "/validators", "/wallet"].includes(pathname) ? (
          <Container maxWidth="md" style={{ paddingBottom: 24 }}>
            <Tabs
              value={pathname}
              variant="fullWidth"
              onChange={handleTabChange}
              indicatorColor="primary"
            >
              <Tab label="Transfer" value="/transfer" />
              <Tab label="Transactions" value="/explorer" />
              <Tab label="Validators" value="/validators" />
              <Tab label="Wallet" value="/wallet" />
            </Tabs>
          </Container>
        ) : null}
        <Switch>
          <Route exact path="/transfer">
            <Transfer />
          </Route>
          <Route exact path="/explorer">
            <Stats />
          </Route>
          <Route exact path="/validators">
            <Validators />
          </Route>
          <Route exact path="/wallet">
            <Wallet />
          </Route>
          <Route>
            <Redirect to="/transfer" />
          </Route>
        </Switch>
      </div>
      <div className={classes.spacer} />
      <div className={classes.gradientRight}></div>
      <div className={classes.gradientRight2}></div>
      <div className={classes.gradientLeft}></div>
      {/* <div className={classes.gradientLeft2}></div> */}
      <Footer />
    </div>
  );
}

export default App;