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