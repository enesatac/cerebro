/**
 * Primary keys of the seed rows. In the database every table has a BIGINT identity column fed by
 * its own sequence; seed rows take 1..n per table in declaration order, like an initial INSERT.
 * Named constants keep the seed and the tests readable (`APP.paymentGateway` instead of `2`).
 */

/** `business units` */
export const BU = {
  digitalChannels: 1,
  finance: 2,
  operations: 3,
  peopleWorkplace: 4,
  technology: 5,
} as const;

/** `people` */
export const PERSON = {
  canOzturk: 1,
  elifKaya: 2,
  hannahSchulz: 3,
  omarHaddad: 4,
  claireDubois: 5,
  marcusWebb: 6,
  graceMensah: 7,
  selinAydin: 8,
  aylinDemir: 9,
  jonasBerg: 10,
  priyaRaman: 11,
  danielOkafor: 12,
  keremYildiz: 13,
  sofiaMarin: 14,
  oleHansen: 15,
  mehmetArslan: 16,
  lauraCosta: 17,
  yukiTanaka: 18,
  inesFerreira: 19,
  burakSahin: 20,
  rafaelGomez: 21,
  emmaLindqvist: 22,
  ahmedNasser: 23,
  zeynepCelik: 24,
  lucasMoreau: 25,
  nadiaPetrova: 26,
  tomBrennan: 27,
} as const;

/** `teams` */
export const TEAM = {
  platform: 1,
  payments: 2,
  digitalExperience: 3,
  commerce: 4,
  operationsSystems: 5,
  data: 6,
  financeSystems: 7,
  workplaceSystems: 8,
  integration: 9,
  appSupport: 10,
} as const;

/** `technologies` */
export const TECH = {
  react: 1,
  angular: 2,
  angularjs: 3,
  typescript: 4,
  java: 5,
  springBoot: 6,
  kotlin: 7,
  nodejs: 8,
  dotnet: 9,
  python: 10,
  struts: 11,
  postgresql: 12,
  oracle: 13,
  mongodb: 14,
  redis: 15,
  elasticsearch: 16,
  kafka: 17,
  rabbitmq: 18,
  ibmMq: 19,
  kubernetes: 20,
  docker: 21,
  terraform: 22,
  aws: 23,
  vmware: 24,
  envoy: 25,
  gitlabCi: 26,
  jenkins: 27,
  prometheus: 28,
  grafana: 29,
  playwright: 30,
} as const;

/** `applications` */
export const APP = {
  customerIdentity: 1,
  paymentGateway: 2,
  notificationService: 3,
  customerPortal: 4,
  employeeSelfService: 5,
  orderManagement: 6,
  financePlatform: 7,
  flightOperationsPortal: 8,
  crewScheduling: 9,
  documentManagement: 10,
  enterpriseDataPlatform: 11,
  apiGateway: 12,
  loyaltyEngine: 13,
  legacyBookingConsole: 14,
  expenseManagement: 15,
  managementReportingHub: 16,
  hrCore: 17,
} as const;

/** `projects` */
export const PRJ = {
  digitalOnboarding: 1,
  paymentModernisation: 2,
  loyaltyLaunch: 3,
  legacyBookingRetirement: 4,
  opsResilience: 5,
  managementReporting: 6,
  workforceMfa: 7,
  notificationConsolidation: 8,
} as const;

/** `dependencies` */
export const DEP = {
  cportCip: 1,
  essCip: 2,
  fopsCip: 3,
  apigwCip: 4,
  loyalCip: 5,
  cipNotif: 6,
  cportOms: 7,
  cportApigw: 8,
  cportLoyal: 9,
  omsPay: 10,
  omsNotif: 11,
  omsLoyal: 12,
  payFinp: 13,
  payNotif: 14,
  fopsCrew: 15,
  fopsNotif: 16,
  essHrc: 17,
  essDms: 18,
  essExp: 19,
  edpOms: 20,
  edpPay: 21,
  edpFinp: 22,
  mrhEdp: 23,
  lbcOms: 24,
  finpDms: 25,
} as const;

/** `integrations` */
export const INT = {
  cportCipOidc: 1,
  essCipOidc: 2,
  apigwCipIntrospect: 3,
  cipNotifEvents: 4,
  notifEmail: 5,
  notifSms: 6,
  notifPush: 7,
  omsPayAuth: 8,
  payAcquirer: 9,
  payFinpSettlement: 10,
  payEdpEvents: 11,
  omsEdpEvents: 12,
  omsNotifQueue: 13,
  fopsCrewApi: 14,
  fopsNotifAlerts: 15,
  hrcEssExport: 16,
  finpGl: 17,
} as const;

/** `risks` */
export const RISK = {
  payDbSupport: 1,
  paySingleAcquirer: 2,
  cipSingleRegion: 3,
  dotVendor: 4,
  lbcNoOwner: 5,
  crewKeyPerson: 6,
  notifSmsCost: 7,
  finpIbmMq: 8,
} as const;

/** `escalations` */
export const ESC = {
  fopsRosterSync: 1,
  dotVendor: 2,
  notifSmsLatency: 3,
  paySettlementMismatch: 4,
} as const;

/** `decisions` */
export const DEC = {
  oidcStandard: 1,
  paymentEventsKafka: 2,
  notificationKafkaIntake: 3,
  lbcRetire: 4,
} as const;

/** `user accounts` */
export const USER = {
  canOzturk: 1,
  selinAydin: 2,
  elifKaya: 3,
  tomBrennan: 4,
  nadiaPetrova: 5,
  zeynepCelik: 6,
} as const;

/** `demands` */
export const DEM = {
  loyaltyMobile: 1,
  workforceMfa: 2,
  walletBoardingPass: 3,
  eInvoiceRegulation: 4,
  expenseOcr: 5,
  crewFatigueDashboard: 6,
  maintenancePlanning: 7,
  logConsolidation: 8,
  realtimeRevenue: 9,
  supplierPortal: 10,
  hrLeaveMobile: 11,
  serviceChatbot: 12,
  notificationPreferences: 13,
  zeroTrustAccess: 14,
  cargoTracking: 15,
} as const;

/** `roles` */
export const ROLE = {
  systemAdmin: 1,
  portfolioOffice: 2,
  manager: 3,
  businessUnit: 4,
  employee: 5,
  auditor: 6,
} as const;
