import { Token } from "models/Token";

export type OrgSettings = {
  name: string;
  symbol: string;
  description: string;
  administrator: string;
  guardian: string;
  governanceToken: {
    address: string;
    tokenId: string;
    tokenMetadata?: Token
  }
};

export type QuorumSettings = {
  quorumThreshold: number;
  minQuorumAmount: number;
  maxQuorumAmount: number;
  quorumChange: number;
  quorumMaxChange: number;
};

export type VotingSettings = {
  proposeStakeRequired: number;
  returnedTokenPercentage: number;
  minXtzAmount: number;
  maxXtzAmount: number;

  votingBlocks: number;
  proposalFlushBlocks: number;
  proposalExpiryBlocks: number;
};

export interface MigrationParams {
  template: DAOTemplate;
  orgSettings: OrgSettings;
  votingSettings: VotingSettings;
  quorumSettings: QuorumSettings;
}

export type Settings = OrgSettings | VotingSettings | QuorumSettings;

export type ErrorValues<T> = Partial<Record<keyof T, string>>;

export interface NavigationBarProps {
  back?: {
    text: string;
    handler: () => void;
  };
  next?: {
    text: string;
    handler: () => void;
  };
}

export type DAOTemplate = "treasury" | "registry";

type DeploymentStatus = {
  deploying: boolean;
  successful: boolean;
  contract?: string;
};

export type CreatorState = {
  data: MigrationParams;
  deploymentStatus: DeploymentStatus;
} & NavigationBarProps;

export enum StepperIndex {
  SELECT_TEMPLATE,
  CONFIGURE_TEMPLATE,
  REVIEW_INFORMATION,
  LAUNCH_ORGANIZATION,
}

export interface StepInfo {
  title: string;
  index: number;
}

function updateNavigationBar(props: NavigationBarProps) {
  return <const>{
    type: ActionTypes.UPDATE_NAVIGATION_BAR,
    ...props,
  };
}

function updateOrgSettings(org: OrgSettings) {
  return <const>{
    type: ActionTypes.UPDATE_ORGANIZATION_SETTINGS,
    org,
  };
}

function updateVotingSettings(voting: VotingSettings) {
  return <const>{
    type: ActionTypes.UPDATE_VOTING_SETTINGS,
    voting,
  };
}

function updateQuorumSettings(quorum: QuorumSettings) {
  return <const>{
    type: ActionTypes.UPDATE_QUORUM_SETTINGS,
    quorum,
  };
}

function updateDeploymentStatus({ deploying, contract }: DeploymentStatus) {
  return <const>{
    type: ActionTypes.UPDATE_DEPLOYMENT_STATUS,
    status: { deploying, contract },
  };
}

function updateTemplate(template: DAOTemplate) {
  return <const>{
    type: ActionTypes.UPDATE_TEMPLATE,
    template,
  };
}

function clearCache() {
  return <const>{
    type: ActionTypes.CLEAR_CACHE,
  };
}

export type CreatorAction = ReturnType<
  | typeof updateTemplate
  | typeof updateNavigationBar
  | typeof updateOrgSettings
  | typeof updateVotingSettings
  | typeof updateQuorumSettings
  | typeof updateDeploymentStatus
  | typeof clearCache
>;

export enum ActionTypes {
  UPDATE_NAVIGATION_BAR = "UPDATE_NAVIGATION_BAR",
  UPDATE_VOTING_SETTINGS = "UPDATE_VOTING_SETTINGS",
  UPDATE_QUORUM_SETTINGS = "UPDATE_QUORUM_SETTINGS",
  UPDATE_ORGANIZATION_SETTINGS = "UPDATE_ORGANIZATION_SETTINGS",
  UPDATE_DEPLOYMENT_STATUS = "UPDATE_DEPLOYMENT_STATUS",
  CLEAR_CACHE = "CLEAR_CACHE",
  UPDATE_TEMPLATE = "UPDATE_TEMPLATE",
}
export interface TokenHolder {
  address: string;
  balance: number;
  name?: string;
}
