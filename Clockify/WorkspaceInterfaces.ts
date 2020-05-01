import { IHourlyRateDto, IMembershipDto } from './CommonDtos';

export interface IWorkspaceDto {
	hourlyRate: IHourlyRateDto;
	id: string;
	imageUrl: string;
	memberships:  IMembershipDto[];
	name: string;
	workspaceSettings: IWorkspaceSettingsDto;
}

interface IWorkspaceSettingsDto {
	adminOnlyPages: AdminOnlyPagesEnum[];
	automaticLock: IAutomaticLockDto;
	canSeeTimeSheet: boolean;
	defaultBillableProjects: boolean;
	forceDescription: boolean;
	forceProjects: boolean;
	forceTags: boolean;
	forceTasks: boolean;
	lockTimeEntries: string;
	onlyAdminsCreateProject: boolean;
	onlyAdminsCreateTag: boolean;
	onlyAdminsSeeAllTimeEntries: boolean;
	onlyAdminsSeeBillableRates: boolean;
	onlyAdminsSeeDashboard: boolean;
	onlyAdminsSeePublicProjectsEntries: boolean;
	projectFavorites: boolean;
	projectGroupingLabel: string;
	projectPickerSpecialFilter: boolean;
	round: IRound;
	timeRoundingInReports: boolean;
	trackTimeDownToSecond: boolean;
}

interface IRound {
	minutes: string;
	round: string;
}

interface IAutomaticLockDto {
	changeDay: DaysOfWeekEnum;
	dayOfMonth: number;
	firstDay: DaysOfWeekEnum;
	olderThanPeriod: DatePeriodEnum;
	olderThanValue: number;
	type: AutomaticLockTypeEnum;
}

enum AutomaticLockTypeEnum {
	WEEKLY = 'WEEKLY',
	MONTHLY = 'MONTHLY',
	OLDER_THAN = 'OLDER_THAN',
}

enum DatePeriodEnum {
	DAYS = 'DAYS',
	WEEKS = 'WEEKS',
	MONTHS = 'MONTHS',
}

enum DaysOfWeekEnum {
	MONDAY = 'MONDAY',
	TUESDAY = 'TUESDAY',
	WEDNESDAY = 'WEDNESDAY',
	THURSDAY = 'THURSDAY',
	FRIDAY = 'FRIDAY',
	SATURDAY = 'SATURDAY',
	SUNDAY = 'SUNDAY',
}

enum AdminOnlyPagesEnum {
	PROJECT ='PROJECT',
	TEAM = 'TEAM',
	REPORTS = 'REPORTS',
}