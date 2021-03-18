import React from "react";
import { Grid, styled, Typography } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { ProposalStatus } from "services/bakingBad/proposals/types";
import { useDAO } from "services/contracts/baseDAO/hooks/useDAO";
import { useProposals } from "services/contracts/baseDAO/hooks/useProposals";
import { ProposalTableRow } from "./ProposalTableRow";
import { ResponsiveTableContainer } from "./ResponsiveTable";

const TableHeader = styled(Grid)(({ theme }) => ({
  borderBottom: `2px solid ${theme.palette.primary.light}`,
  paddingBottom: 20,
}));

const ProposalTableHeadText: React.FC = ({ children }) => (
  <ProposalTableHeadItem variant="subtitle1" color="textSecondary">
    {children}
  </ProposalTableHeadItem>
);

const ProposalTableHeadItem = styled(Typography)({
  fontWeight: "bold",
});

const NoProposals = styled(Typography)({
  marginTop: 20,
  marginBottom: 20,
});

export const ActiveProposalsTable: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading: isDaoLoading } = useDAO(id);
  const {
    data: activeProposals,
    isLoading: isActiveProposalsLoading,
  } = useProposals(data ? data.address : "", ProposalStatus.ACTIVE);

  return (
    <ResponsiveTableContainer>
      <TableHeader container direction="row">
        <Grid item xs={4}>
          <ProposalTableHeadText>ACTIVE PROPOSALS</ProposalTableHeadText>
        </Grid>
        <Grid item xs={2}>
          <ProposalTableHeadItem color="textSecondary" align="center">
            CYCLE
          </ProposalTableHeadItem>
        </Grid>
        <Grid item xs={3}></Grid>
        <Grid item xs={3}>
          <ProposalTableHeadText>THRESHOLD %</ProposalTableHeadText>
        </Grid>
      </TableHeader>
      {activeProposals.length > 0 &&
        activeProposals.map((proposal, i) => (
          <ProposalTableRow
            key={`proposal-${i}`}
            {...proposal}
            daoId={data?.address}
            quorumTreshold={data?.storage.quorumTreshold || 0}
          />
        ))}
      {activeProposals.length === 0 ? (
        <NoProposals variant="subtitle1" color="textSecondary">
          No active proposals
        </NoProposals>
      ) : null}
    </ResponsiveTableContainer>
  );
};
