import { Grid, Paper, styled, Typography, Slider, withStyles, withTheme, Box, Tooltip } from "@material-ui/core";
import { TextField } from "formik-material-ui";
import React, { useContext, useEffect, useState } from "react";
import { Field, Form, Formik, FormikErrors, getIn } from "formik";
import { useHistory } from "react-router";
import { useRouteMatch } from "react-router-dom";

import { CreatorContext, ActionTypes, VotingSettings } from "modules/creator/state";
import { InfoOutlined } from "@material-ui/icons";
import { getNetworkStats } from "services/bakingBad/stats";
import { useTezos } from "services/beacon/hooks/useTezos";
import { EstimatedTime } from "modules/explorer/components/EstimatedTime";
import { theme } from "../../../theme";
import { getEstimatedTime } from "../../../services/time/calculateTime";

const CustomTypography = styled(Typography)(({ theme }) => ({
  paddingBottom: 10,
  borderBottom: `1px solid ${theme.palette.primary.light}`,
  marginTop: 10,
  marginBottom: 33,
}));

const CustomSpan = styled("span")({
  color: theme.palette.secondary.main,
});

const ErrorText = styled(Typography)({
  display: "block",
  fontSize: 14,
  color: "red",
});

const SecondContainer = styled(Grid)({
  marginTop: 10,
});

const SpacingContainer = styled(Grid)({
  marginTop: 25,
});

const StakeContainer = styled(Grid)({
  display: "block",
});

const CustomInputContainer = styled(Grid)(({ theme }) => ({
  border: `1px solid ${theme.palette.primary.light}`,
  height: 62,
  marginTop: 14,
  "&:nth-child(2)": {
    borderLeft: "none",
    borderRight: "none",
    [theme.breakpoints.down("sm")]: {
      borderLeft: `1px solid ${theme.palette.primary.light}`,
      borderRight: `1px solid ${theme.palette.primary.light}`,
    },
  },
}));

const AdditionContainer = styled(Grid)(({ theme }) => ({
  marginTop: 14,
  border: `1px solid ${theme.palette.primary.light}`,
  height: 62,
}));

const GridItemCenter = styled(Grid)({
  textAlign: "center",
});

const ItemContainer = styled(Grid)(({ theme }) => ({
  height: "100%",
  padding: 12,
  "&:hover": {
    background: "rgba(129, 254, 183, 0.03)",
    borderLeft: `2px solid ${theme.palette.secondary.light}`,
  },
}));

const GridItemContainer = styled(Grid)(() => ({
  display: "flex",
  alignItems: "center",
}));

const ValueText = styled(Typography)({
  fontSize: 14,
});

const StyledSlider = withStyles({
  root: {
    textAlign: "center",
    width: "100%",
  },
  valueLabel: {
    textAlign: "center",
  },
  thumb: {
    height: 20,
    width: 20,
    top: "24.5%",
    backgroundColor: "#fff",
    border: "3px solid #fff",
  },
  track: {
    backgroundColor: "#4BCF93",
    borderRadius: "4px",
    height: 2,
  },
})(Slider);

const CustomSliderValue = styled(withTheme(Paper))((props) => ({
  boxShadow: "none",
  height: 62,
  border: `1px solid ${props.theme.palette.primary.light}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 0,
  background: props.theme.palette.primary.main,
}));

const Value = styled(Typography)({
  textAlign: "center",
  padding: "15%",
});

const styles = {
  voting: {
    marginTop: 6,
  },
};

const GridNoPadding = styled(Grid)({
  padding: "0px !important",
});

const InfoIconInput = styled(InfoOutlined)({
  cursor: "default",
});

const validateForm = (values: VotingSettings) => {
  const errors: FormikErrors<VotingSettings> = {};

  Object.keys(values).forEach((key) => {
    if ((values[key as keyof VotingSettings] as number | string) === "") {
      errors[key as keyof VotingSettings] = "Required";
    }

    if (Number(values[key as keyof VotingSettings]) < 0) {
      errors[key as keyof VotingSettings] = "Cannot be negative";
    }
  });

  if (!values.votingBlocks) {
    errors.votingBlocks = "Voting Period blocks cannot be 0";
  }

  if (!values.proposalFlushBlocks) {
    errors.proposalFlushBlocks = "Proposal Flush Delay blocks cannot be 0";
  }

  if (!values.proposalExpiryBlocks) {
    errors.proposalExpiryBlocks = "Proposal blocks to expire cannot be 0";
  }

//   if (
//     values.votingBlocks !== undefined &&
//     values.proposalFlushBlocks !== undefined &&
//     values.proposalExpiryBlocks !== undefined
//   ) {
//     if (values.proposalFlushBlocks <= values.votingBlocks * 2) {
//       errors.proposalFlushBlocks = "Must be more than double the Voting Period Duration";
//     }

//     if (values.proposalExpiryBlocks <= values.proposalFlushBlocks) {
//       errors.proposalExpiryBlocks = "Must be greater than Proposal Flush Delay Duration";
//     }
//   }

  if (values.proposeStakeRequired <= 0) {
    errors.proposeStakeRequired = "Must be greater than 0";
  }

  if (values.maxXtzAmount <= 0) {
    errors.maxXtzAmount = "Must be greater than 0";
  }

  if (values.minXtzAmount > values.maxXtzAmount) {
    errors.maxXtzAmount = "Must be greater than Min. XTZ amount";
  }

  return errors;
};

//TODO: Remove any from this component
const GovernanceForm = ({ submitForm, values, setFieldValue, errors, touched }: any) => {
  const { network } = useTezos();
  const {
    dispatch,
    state: {
      data: { orgSettings },
    },
  } = useContext(CreatorContext);
  const match = useRouteMatch();
  const history = useHistory();
  const [blockTimeAverage, setBlockTimeAverage] = useState<number>(0);
  const { votingBlocks, proposalFlushBlocks, proposalExpiryBlocks } = values;
  const initialProposalTime = getEstimatedTime();
  const doubleVoting = votingBlocks && 2 * parseInt(votingBlocks);
  const timeToCreateProposal = votingBlocks && getEstimatedTime(parseInt(votingBlocks) * blockTimeAverage);
  const votingCloseTime = doubleVoting && getEstimatedTime(doubleVoting * blockTimeAverage);
  const executableTime =
    doubleVoting &&
    proposalFlushBlocks &&
    getEstimatedTime((doubleVoting + parseInt(proposalFlushBlocks)) * blockTimeAverage);
  const expireProposalTime =
    doubleVoting &&
    proposalFlushBlocks &&
    proposalExpiryBlocks &&
    getEstimatedTime((doubleVoting + parseInt(proposalFlushBlocks) + parseInt(proposalFlushBlocks)) * blockTimeAverage);

  useEffect(() => {
    (async () => {
      let blockDuration = 0;
      const blockchainInfo = await getNetworkStats(network);
      if (blockchainInfo) {
        blockchainInfo.time_between_blocks.forEach((time) => (blockDuration = blockDuration + time));
        setBlockTimeAverage(blockDuration / 2);
      }
    })();
  }, [network]);

  useEffect(() => {
    if (values) {
      dispatch({
        type: ActionTypes.UPDATE_NAVIGATION_BAR,
        next: {
          text: "CONTINUE",
          handler: () => {
            submitForm(values);
          },
        },
        back: {
          text: "BACK",
          handler: () => history.push(`dao`),
        },
      });
    }
  }, [dispatch, errors, history, match.path, match.url, submitForm, values]);

  return (
    <>
      <Grid container>
        <Grid item style={{ marginRight: 15 }}>
          <SecondContainer container direction='row'>
            <Typography style={styles.voting} variant='subtitle1' color='textSecondary'>
              Voting Cycle Duration
            </Typography>
          </SecondContainer>

          <GridItemContainer>
            <CustomInputContainer item xs={12}>
              <ItemContainer container direction='row' alignItems='center' justify='center'>
                <GridItemCenter item xs={6}>
                  <Field
                    name='votingBlocks'
                    type='number'
                    placeholder='00'
                    component={TextField}
                    inputProps={{ min: 0 }}></Field>
                </GridItemCenter>
                <GridItemCenter item xs={6}>
                  <Typography color='textSecondary'>blocks</Typography>
                </GridItemCenter>
              </ItemContainer>
            </CustomInputContainer>
          </GridItemContainer>

          <Grid item style={{ margin: "14px 15px", height: 62 }}>
            <EstimatedTime blockTimeAverage={blockTimeAverage} blockQty={votingBlocks ? votingBlocks : 0} />
          </Grid>
        </Grid>
        <Grid item style={{ marginRight: 15 }}>
          <SecondContainer container direction='row'>
            <Typography style={styles.voting} variant='subtitle1' color='textSecondary'>
              Proposal Execution Delay
            </Typography>
          </SecondContainer>

          <GridItemContainer>
            <CustomInputContainer item xs={12}>
              <ItemContainer container direction='row' alignItems='center' justify='center'>
                <GridItemCenter item xs={6}>
                  <Field
                    name='proposalFlushBlocks'
                    type='number'
                    placeholder='00'
                    component={TextField}
                    inputProps={{ min: 0 }}
                  />
                </GridItemCenter>
                <GridItemCenter item xs={6}>
                  <Typography color='textSecondary'>blocks</Typography>
                </GridItemCenter>
              </ItemContainer>
            </CustomInputContainer>
          </GridItemContainer>

          <Grid item style={{ marginLeft: 15, height: 62, marginTop: 14 }}>
            <EstimatedTime
              blockTimeAverage={blockTimeAverage}
              blockQty={proposalFlushBlocks ? proposalFlushBlocks : 0}
            />
          </Grid>
        </Grid>

        <Grid item style={{ marginRight: 15 }}>
          <SecondContainer container direction='row'>
            <Typography style={styles.voting} variant='subtitle1' color='textSecondary'>
              Proposal Expiration Threshold
            </Typography>
          </SecondContainer>

          <GridItemContainer>
            <CustomInputContainer item xs={12}>
              <ItemContainer container direction='row' alignItems='center' justify='center'>
                <GridItemCenter item xs={6}>
                  <Field
                    name='proposalExpiryBlocks'
                    type='number'
                    placeholder='00'
                    component={TextField}
                    inputProps={{ min: 0 }}
                  />
                </GridItemCenter>
                <GridItemCenter item xs={6}>
                  <Typography color='textSecondary'>blocks</Typography>
                </GridItemCenter>
              </ItemContainer>
            </CustomInputContainer>
          </GridItemContainer>

          <Grid item style={{ marginLeft: 15, height: 62, marginTop: 14 }}>
            <EstimatedTime
              blockTimeAverage={blockTimeAverage}
              blockQty={proposalExpiryBlocks ? proposalExpiryBlocks : 0}
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item style={{ margin: "24px 0" }}>
        <Typography color={"textSecondary"}>
          If Jane creates a DAO at{" "}
          <CustomSpan>
            {initialProposalTime.dateHour} on {initialProposalTime.date}
          </CustomSpan>
          , she will be able to create a proposal at{" "}
          <CustomSpan>
            {timeToCreateProposal ? `${timeToCreateProposal.dateHour} on ${timeToCreateProposal.date}` : "-------"}
          </CustomSpan>
          . Voting will close at{" "}
          <CustomSpan>
            {votingCloseTime ? `${votingCloseTime.dateHour} on ${votingCloseTime.date}` : "-------"}
          </CustomSpan>
          . If the proposal passes, it&apos;ll be executable at{" "}
          <CustomSpan>{executableTime ? `${executableTime.dateHour} on ${executableTime.date}` : "-------"}</CustomSpan>{" "}
          and will expire at{" "}
          <CustomSpan>
            {expireProposalTime ? `${expireProposalTime.dateHour} on ${expireProposalTime.date}` : "-------"}
          </CustomSpan>
        </Typography>
      </Grid>

      <Grid item style={{ marginTop: 12 }}>
        <SecondContainer container direction='row'>
          <Typography style={styles.voting} variant='subtitle1' color='textSecondary'>
            Required Stake to Propose
          </Typography>
        </SecondContainer>

        <StakeContainer container direction='row' alignItems='center'>
          <AdditionContainer item xs={11} sm={4}>
            <ItemContainer container direction='row' alignItems='center' justify='center'>
              <GridItemCenter item xs={6}>
                <Field
                  name='proposeStakeRequired'
                  type='number'
                  placeholder='00'
                  inputProps={{ min: 0, defaultValue: 0 }}
                  component={TextField}
                />
              </GridItemCenter>
              <GridItemCenter item xs={6} container direction='row' justify='space-around'>
                <Typography color='textSecondary'>{orgSettings.governanceToken.tokenMetadata?.symbol || ""}</Typography>
                <Tooltip
                  placement='bottom'
                  title={`Amount of ${
                    orgSettings.governanceToken.tokenMetadata?.symbol || ""
                  } required to make a proposal. Total supply: ${orgSettings.governanceToken.tokenMetadata?.supply}`}>
                  <InfoIconInput color='secondary' />
                </Tooltip>
              </GridItemCenter>
            </ItemContainer>
          </AdditionContainer>
          {errors.proposeStakeRequired || errors.proposeStakePercentage ? (
            <ErrorText>{errors.proposeStakeRequired || errors.proposeStakePercentage}</ErrorText>
          ) : null}
        </StakeContainer>
      </Grid>

      <SecondContainer container direction='row'>
        <Typography style={styles.voting} variant='subtitle1' color='textSecondary'>
          Returned Stake After Proposal Rejection
        </Typography>

        <Grid container direction='row' alignItems='center' spacing={1} style={{ marginTop: 14 }}>
          <GridNoPadding item xs={8} sm={9}>
            <Field name='frozenScaleValue'>
              {() => (
                <StyledSlider
                  value={getIn(values, "frozenScaleValue")}
                  onChange={(value: any, newValue: any) => setFieldValue("frozenScaleValue", newValue || 0)}
                />
              )}
            </Field>
          </GridNoPadding>
          <GridNoPadding item xs={4} sm={3}>
            <CustomSliderValue>
              <Value variant='subtitle1' color='textSecondary'>
                {getIn(values, "frozenScaleValue")}%
              </Value>
            </CustomSliderValue>
          </GridNoPadding>
        </Grid>
      </SecondContainer>

      <SpacingContainer direction='row' container alignItems='center'>
        <Typography variant='subtitle1' color='textSecondary'>
          Min & Max Transfer Amounts
        </Typography>
      </SpacingContainer>
      <Grid container direction='row' alignItems='center' style={{ marginTop: 14 }}>
        <AdditionContainer item xs={12} sm={4}>
          <ItemContainer container direction='row' alignItems='center' justify='center'>
            <GridItemCenter item xs={5}>
              <Field name='minXtzAmount' type='number' placeholder='00' component={TextField}></Field>
            </GridItemCenter>
            <GridItemCenter item xs={7} container direction='row' justify='space-around'>
              <ValueText color='textSecondary'>Min. XTZ</ValueText>
              <Tooltip placement='bottom' title='Minimum amount of XTZ that can be transferred'>
                <InfoIconInput color='secondary' />
              </Tooltip>
            </GridItemCenter>
          </ItemContainer>
          {errors.minXtzAmount && touched.minXtzAmount ? <ErrorText>{errors.minXtzAmount}</ErrorText> : null}
        </AdditionContainer>
        <AdditionContainer item xs={12} sm={4}>
          <ItemContainer container direction='row' alignItems='center' justify='center'>
            <GridItemCenter item xs={5}>
              <Field name='maxXtzAmount' type='number' placeholder='00' component={TextField}></Field>
            </GridItemCenter>
            <GridItemCenter item xs={7} container direction='row' justify='space-around'>
              <ValueText color='textSecondary'>Max. XTZ </ValueText>
              <Tooltip placement='bottom' title='Maximum amount of XTZ that can be transferred'>
                <InfoIconInput color='secondary' />
              </Tooltip>
            </GridItemCenter>
          </ItemContainer>
          {errors.maxXtzAmount && touched.maxXtzAmount ? <ErrorText>{errors.maxXtzAmount}</ErrorText> : null}
        </AdditionContainer>
      </Grid>
    </>
  );
};

//TODO: Remove any from this component
export const Governance: React.FC = () => {
  const { dispatch, state, updateCache } = useContext(CreatorContext);
  const { votingSettings } = state.data;
  const history = useHistory();

  const saveStepInfo = (values: VotingSettings, { setSubmitting }: { setSubmitting: (b: boolean) => void }) => {
    const newState = {
      ...state.data,
      votingSettings: values,
    };
    updateCache(newState);
    setSubmitting(true);
    dispatch({ type: ActionTypes.UPDATE_VOTING_SETTINGS, voting: values });
    history.push(`quorum`);
  };

  return (
    <Box maxWidth={950}>
      <Grid container direction='row' justify='space-between'>
        <Grid item xs={12}>
          <Typography variant='h3' color='textSecondary'>
            Proposals & Voting
          </Typography>
        </Grid>
      </Grid>
      <Grid container direction='row'>
        <Grid item xs={12}>
          <CustomTypography variant='subtitle1' color='textSecondary'>
            These settings will define the duration, support and approval required for proposals.
          </CustomTypography>
        </Grid>
      </Grid>

      <Formik enableReinitialize validate={validateForm} onSubmit={saveStepInfo} initialValues={votingSettings}>
        {({ submitForm, isSubmitting, setFieldValue, values, errors, touched }) => {
          return (
            <Form style={{ width: "100%" }}>
              <GovernanceForm
                submitForm={submitForm}
                isSubmitting={isSubmitting}
                setFieldValue={setFieldValue}
                errors={errors}
                touched={touched}
                values={values}
              />
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};
