import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  styled,
  Typography,
} from "@material-ui/core";
import Timer from "react-compound-timer";
import LinearProgress from "@material-ui/core/LinearProgress";
import { useHistory, useParams } from "react-router-dom";

import HouseIcon from "src/assets/logos/house.svg";
import VotingIcon from "src/assets/logos/voting.svg";
import VotingPeriodIcon from "src/assets/logos/votingPeriod.svg";
import VoteTimeIcon from "src/assets/logos/voteTime.svg";
import {
  mapProposalData,
  ProposalTableRow,
  ProposalTableRowData,
} from "src/modules/daoexplorer/components/ProposalTableRow";
import { TokenHoldersDialog } from "src/modules/daoexplorer/components/TokenHoldersDialog";
import { useDAO } from "src/services/contracts/baseDAO/hooks/useDAO";
import { useProposals } from "src/services/contracts/baseDAO/hooks/useProposals";
import { ProposalStatus } from "src/services/bakingBad/proposals/types";
import { TopHoldersTableRow } from "src/modules/daoexplorer/components/TopHoldersTableRow";
import { useCycleInfo } from "src/services/contracts/baseDAO/hooks/useCycleInfo";

const SideBar = styled(Grid)({
  width: 102,
  borderRight: "2px solid #3D3D3D",
});

const MainContainer = styled(Grid)({
  minHeight: 325,
  padding: "40px 112px",
  borderBottom: "2px solid #3D3D3D",
});

const SidebarButton = styled(IconButton)({
  paddingTop: 32,
  width: "100%",
});

const LoaderContainer = styled(Grid)({
  paddingTop: 40,
  paddingBottom: 40,
});

const PageLayout = styled(Grid)(({ theme }) => ({
  background: theme.palette.primary.main,
  minHeight: "calc(100vh - 102px)",
}));

const DAOInfoTitleAndDesc = styled(Grid)({
  maxWidth: 600,
  marginBottom: 40,
});

const DAOInfoVotingPeriod = styled(Grid)({
  minWidth: 320,
});

const BigIconContainer = styled(Box)({
  width: 112,

  "& > img": {
    display: "block",
    margin: "auto",
  },
});

const StatsContainer = styled(Grid)({
  height: 175,
  borderBottom: "2px solid #3D3D3D",
});

const StatsBox = styled(Grid)({
  borderRight: "2px solid #3D3D3D",
  width: "unset",
});

const TokensLocked = styled(StatsBox)({
  padding: "0 50px 0 112px",
});

const VotingAddresses = styled(StatsBox)({
  minWidth: 250,
});

const ActiveProposals = styled(StatsBox)({
  paddingLeft: "42px",
  cursor: "pointer",
});

const LockedTokensBar = styled(LinearProgress)({
  width: "100%",
  "&.MuiLinearProgress-colorSecondary": {
    background: "#3D3D3D",
  },
});

const TableContainer = styled(Box)({
  width: "100%",
  padding: "72px 112px",
  boxSizing: "border-box",
  paddingBottom: "24px",
});

const TableHeader = styled(Grid)({
  borderBottom: "2px solid #3D3D3D",
  paddingBottom: 20,
});

const UnderlineText = styled(Typography)({
  textDecoration: "underline",
  cursor: "pointer",
  marginBottom: 28,
});

const CustomH1 = styled(Typography)({
  fontSize: 55,
  lineHeight: "92px",
  textDecoration: "underline",
  fontWeight: 400,
});

const NoProposals = styled(Typography)({
  marginTop: 20,
  marginBottom: 20,
});

const ProposalTableHeadText: React.FC = ({ children }) => (
  <Typography variant="subtitle1" color="textSecondary">
    {children}
  </Typography>
);

export const DAO: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { data } = useDAO(id);

  const name = data && data.unfrozenToken.name;
  const description = data && data.description;
  const symbol = data && data.unfrozenToken.symbol.toUpperCase();
  const members = data && data.ledger;

  const votingPeriod = data && data.votingPeriod;
  const originationTime = data && data.originationTime;
  const cycleInfo = useCycleInfo(originationTime, votingPeriod);
  const time = cycleInfo && cycleInfo.time;
  const [currentCycle, setCurrentCycle] = useState(
    cycleInfo && cycleInfo.current
  );
  const [timeLeft, setTimeLeft] = useState<number>(time || 0);
  const [finished, setFinished] = useState<boolean>(false);

  useEffect(() => {
    console.log(votingPeriod);
    console.log(currentCycle);
    console.log("cycle info ", cycleInfo?.current);
    if (votingPeriod && finished && cycleInfo?.current) {
      console.log("I AM IN");
      setFinished(false);
      setTimeLeft(votingPeriod);
      setCurrentCycle((currentCycle || cycleInfo.current) + 1);
    }
  }, [finished, votingPeriod, currentCycle, cycleInfo?.current]);

  useEffect(() => {
    if (time) {
      setTimeLeft(time);
    }
  }, [time]);

  const amountLocked = useMemo(() => {
    if (!data) {
      setIsLoading(true);
      return 0;
    }

    return data.ledger.reduce((acc, current) => {
      const frozenBalance = current.balances[1] || 0;
      setIsLoading(false);
      return acc + frozenBalance;
    }, 0);
  }, [data]);

  const addressesWithUnfrozenBalance = useMemo(() => {
    if (!data) {
      setIsLoading(true);
      return 0;
    }

    return data.ledger.reduce((acc, current) => {
      const frozenBalance = current.balances[0];
      if (frozenBalance) {
        return acc + 1;
      }
      setIsLoading(false);
      return acc;
    }, 0);
  }, [data]);

  const { data: proposalsData } = useProposals(data ? data.address : "");

  const membersLedger = useMemo(() => {
    if (!members || !members.length) {
      return [];
    }
    return members.map((member) => {
      return member.address;
    });
  }, [members]);

  const activeProposals = useMemo<ProposalTableRowData[]>(() => {
    if (!proposalsData || finished) {
      return [];
    }

    return proposalsData
      .filter((proposalData) => proposalData.status === ProposalStatus.ACTIVE)
      .map((proposal) => mapProposalData(proposal, data?.address));
  }, [data?.address, proposalsData, finished]);

  const tokenHolders = [
    {
      username: "Username89",
      votes: "1,232,123.02",
      weight: "22.33",
      proposals_voted: 12,
    },
    {
      username: "Username90",
      votes: "454,555.50",
      weight: "15,34",
      proposals_voted: 20,
    },
  ];

  const checkpoints = [
    {
      time: 0,
      callback: () => {
        setFinished(true);
      },
    },
  ];
  return (
    <PageLayout container wrap="nowrap">
      <SideBar item>
        <SidebarButton>
          <img src={HouseIcon} />
        </SidebarButton>
        <SidebarButton>
          <img src={VotingIcon} />
        </SidebarButton>
      </SideBar>
      {!isLoading ? (
        <Grid item xs>
          <MainContainer container justify="space-between">
            <DAOInfoTitleAndDesc item>
              <Box>
                <Typography variant="subtitle2" color="secondary">
                  {symbol}
                </Typography>
              </Box>
              <Box paddingBottom="10px">
                <CustomH1 color="textSecondary">{name}</CustomH1>
              </Box>
              <Box>
                <Typography variant="body1" color="textSecondary">
                  {description}
                </Typography>
              </Box>
            </DAOInfoTitleAndDesc>
            <DAOInfoVotingPeriod item>
              <Box paddingBottom="32px">
                <Grid container>
                  <Grid item>
                    <BigIconContainer>
                      <img src={VotingPeriodIcon} />
                    </BigIconContainer>
                  </Grid>
                  <Grid item>
                    <Box paddingLeft="35px">
                      <Box>
                        <Typography variant="subtitle2" color="secondary">
                          CURRENT CYCLE
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h3" color="textSecondary">
                          {currentCycle || cycleInfo?.current}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              <Box paddingBottom="32px">
                <Grid container>
                  <Grid item>
                    <BigIconContainer>
                      <img src={VoteTimeIcon} />
                    </BigIconContainer>
                  </Grid>
                  <Grid item>
                    <Box paddingLeft="35px">
                      <Box>
                        <Typography variant="subtitle2" color="secondary">
                          TIME LEFT TO VOTE
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h3" color="textSecondary">
                          {!finished && time && timeLeft ? (
                            <Timer
                              initialTime={timeLeft * 1000}
                              direction="backward"
                              checkpoints={checkpoints}
                            >
                              {() => (
                                <React.Fragment>
                                  <Box>
                                    <Timer.Days />d <Timer.Hours />h{" "}
                                    <Timer.Minutes />m <Timer.Seconds />s
                                  </Box>
                                </React.Fragment>
                              )}
                            </Timer>
                          ) : null}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </DAOInfoVotingPeriod>
          </MainContainer>
          <StatsContainer container>
            <TokensLocked
              item
              xs={6}
              container
              direction="column"
              alignItems="center"
              justify="center"
            >
              <Grid container justify="space-between" alignItems="center">
                <Grid item>
                  <Box>
                    <Typography variant="subtitle2" color="secondary">
                      {symbol} Locked
                    </Typography>
                  </Box>
                  <Box padding="12px 0">
                    <Typography variant="h3" color="textSecondary">
                      {amountLocked}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <TokenHoldersDialog address={id} />
                </Grid>
              </Grid>
              <LockedTokensBar
                variant="determinate"
                value={60}
                color="secondary"
              />
            </TokensLocked>
            <VotingAddresses
              item
              container
              direction="column"
              alignItems="center"
              justify="center"
            >
              <Box>
                <Typography variant="subtitle2" color="secondary">
                  VOTING ADDRESSES
                </Typography>
                <Typography variant="h3" color="textSecondary">
                  {addressesWithUnfrozenBalance}
                </Typography>
              </Box>
            </VotingAddresses>
            <ActiveProposals
              item
              xs
              container
              direction="column"
              justify="center"
              onClick={() => history.push(`/explorer/proposals/${id}`)}
            >
              <Box>
                <Typography variant="subtitle2" color="secondary">
                  ACTIVE PROPOSALS
                </Typography>
                <Typography variant="h3" color="textSecondary">
                  {activeProposals.length}
                </Typography>
              </Box>
            </ActiveProposals>
          </StatsContainer>
          <TableContainer>
            <TableHeader container wrap="nowrap">
              <Grid item xs={5}>
                <ProposalTableHeadText>ACTIVE PROPOSALS</ProposalTableHeadText>
              </Grid>
              <Grid item xs={2}>
                <ProposalTableHeadText>CYCLE</ProposalTableHeadText>
              </Grid>
              <Grid item xs={5}>
                <ProposalTableHeadText>STATUS</ProposalTableHeadText>
              </Grid>
            </TableHeader>
            {activeProposals.length > 0 &&
              activeProposals.map((proposal, i) => (
                <ProposalTableRow key={`proposal-${i}`} {...proposal} />
              ))}

            {activeProposals.length === 0 ? (
              <NoProposals variant="subtitle1" color="textSecondary">
                No active proposals
              </NoProposals>
            ) : null}
          </TableContainer>
          <Grid container direction="row" justify="center">
            <UnderlineText
              variant="subtitle1"
              color="textSecondary"
              onClick={() => history.push(`/explorer/proposals/${id}`)}
            >
              VIEW ALL PROPOSALS
            </UnderlineText>
          </Grid>

          <TableContainer>
            <TableHeader container wrap="nowrap">
              <Grid item xs={5}>
                <ProposalTableHeadText>
                  TOP TOKEN HOLDERS BY ADDRESS
                </ProposalTableHeadText>
              </Grid>
              <Grid item xs={3}>
                <ProposalTableHeadText>VOTES</ProposalTableHeadText>
              </Grid>
              <Grid item xs={2}>
                <ProposalTableHeadText>WEIGHT</ProposalTableHeadText>
              </Grid>
              <Grid item xs={2}>
                <ProposalTableHeadText>PROPOSALS VOTED</ProposalTableHeadText>
              </Grid>
            </TableHeader>
            {tokenHolders.map((holder, i) => (
              <TopHoldersTableRow key={`holder-${i}`} {...holder} index={i} />
            ))}
          </TableContainer>
        </Grid>
      ) : (
        <LoaderContainer container direction="row" justify="center">
          <CircularProgress color="secondary" />
        </LoaderContainer>
      )}
    </PageLayout>
  );
};
