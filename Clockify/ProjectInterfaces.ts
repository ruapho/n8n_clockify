import { IMembershipDto, IHourlyRateDto, IEstimateDto } from "./CommonDtos";

export interface IProjectImpl {
    archived: boolean,
    billable: boolean,
    clientId: string,
    clientName: string,
    color: string,
    duration: string,
    estimate: IEstimateDto,
    hourlyRate: IHourlyRateDto,
    id: string,
    memberships: IMembershipDto[],
    name: string,
    public: boolean,
    workspaceId: string
}

export interface IAddProject {
    name: string,
    // OPTIONAL
    clientId: string,
    isPublic: boolean,
    estimate: IEstimateDto,
    color: string,
    note: string,
    billable: boolean
}