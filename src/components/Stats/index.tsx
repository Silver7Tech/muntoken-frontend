import {
  CircularProgress,
  Container,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core";
import clsx from "clsx";
import { useMemo } from "react";
import { COLORS } from "../../muiTheme";
import MuiReactTable from "./tableComponents/MuiReactTable";
import useTransactionData from "../../diversifi/useTransactionData";

const useStyles = makeStyles((theme) => ({
  logoPositioner: {
    height: "30px",
    width: "30px",
    maxWidth: "30px",
    marginRight: theme.spacing(1),
    display: "flex",
    alignItems: "center",
  },
  logo: {
    maxHeight: "100%",
    maxWidth: "100%",
  },
  tokenContainer: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  mainPaper: {
    backgroundColor: COLORS.whiteWithTransparency,
    padding: "2rem",
    "& > h, & > p ": {
      margin: ".5rem",
    },
    "& .MuiTableCell-root:first-child": {
      whiteSpace: "nowrap"
    },
    "& .MuiTableContainer-root": {
      height: "600px",
      overflowY: "auto"
    },
    marginBottom: theme.spacing(8),
  },
  flexBox: {
    display: "flex",
    alignItems: "flex-end",
    marginBottom: theme.spacing(4),
    textAlign: "left",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      alignItems: "unset",
    },
  },
  grower: {
    flexGrow: 1,
  },
  explainerContainer: {},
  totalContainer: {
    display: "flex",
    alignItems: "flex-end",
    paddingBottom: 1, // line up with left text bottom
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing(1),
    },
  },
  totalValue: {
    marginLeft: theme.spacing(0.5),
    marginBottom: "-.125em", // line up number with label
  },
  alignCenter: {
    margin: "0 auto",
    display: "block",
  },
}));

const StatsRoot: React.FC<any> = () => {
  const classes = useStyles();
  const data = useTransactionData();

  const sortTokens = useMemo(() => {
    return (rowA: any, rowB: any) => {
      return 1;
    };
  }, []);
  const tvlColumns = useMemo(() => {
    return [
      {
        Header: "Timestamp",
        id: "timestamp",
        disableGroupBy: true,
        accessor: "time",
      },
      {
        Header: "TxHash",
        id: "txHash",
        disableGroupBy: true,
        accessor: "confirmedBlockHash",
      },
      { 
        Header: "Creator", 
        accessor: "creator",
        disableGroupBy: true,
       },
      {
        Header: "Content",
        accessor: "content",
        disableGroupBy: true,
      },
      {
        Header: "Amount",
        accessor: "amount",
        disableGroupBy: true,
      },
      {
        Header: "Fee",
        accessor: "fee",
        disableGroupBy: true,
      },
      {
        Header: "Status",
        accessor: "status",
        disableGroupBy: true,
      },
    ];
  }, [
    classes.logo,
    classes.tokenContainer,
    classes.logoPositioner,
    sortTokens,
  ]);
  const tvlString = useMemo(() => {
    if (!data) {
      return "";
    } else {
      return data.length;
    }
  }, [data]);

  return (
    <Container maxWidth="lg">
      <div className={classes.flexBox}>
        <div className={classes.explainerContainer}>
          <Typography variant="h4">Transactions</Typography>
        </div>
        <div className={classes.grower} />
        {data.length > 0 ? (
          <div
            className={clsx(classes.explainerContainer, classes.totalContainer)}
          >
            <Typography
              variant="body2"
              color="textSecondary"
              component="div"
              noWrap
            >
              {"Total: "}
            </Typography>
            <Typography
              variant="h3"
              component="div"
              noWrap
              className={classes.totalValue}
            >
              {tvlString}
            </Typography>
          </div>
        ) : null}
      </div>
      <Paper className={classes.mainPaper}>
        {data.length > 0 ? (
          <MuiReactTable
            columns={tvlColumns}
            data={data || []}
            skipPageReset={false}
            initialState={{ sortBy: [{ id: "timestamp", desc: true }] }}
          />
        ) : (
          <CircularProgress className={classes.alignCenter} />
        )}
      </Paper>
    </Container>
  );
};

export default StatsRoot;
