export interface Task {
    assigneeIds: string[]
    estimate: string
    id: string
    name: string
    projectId: string
    status: TaskStatus
}

export interface TaskRequest {
    projectId: string
    name: string
    assigneeIds?: string[]
    estimate?: string
    status?: TaskStatus
}

export enum TaskStatus {
    ACTIVE = 'ACTIVE',
    DONE = 'DONE'
}