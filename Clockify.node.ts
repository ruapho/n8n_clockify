import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions
} from 'n8n-workflow';

import { clockifyApiRequest } from './Clockify/GenericFunctions';
import { IWorkspaceDto } from './Clockify/WorkspaceInterfaces';
import { ClockifyFunctions } from './Clockify/ClockifyFunctionEnum';
import { ICurrentUserDto } from './Clockify/UserDtos';
import { IAddProject, IProjectImpl } from './Clockify/ProjectInterfaces';
import { Task, TaskRequest, TaskStatus } from './Clockify/TaskInterfaces';

export class Clockify implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Clockify',
		name: 'clockify',
		icon: 'file:clockify.png',
		group: ['transform'],
		version: 1,
		description: 'Consumes the clockify api',
		defaults: {
			name: 'Clockify',
			color: '#00FF00',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'clockifyApi',
				required: true,
			}
		],
		properties: [
			{
				displayName: 'Workspace',
				name: 'workspaceId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'listWorkspaces' },
				default: '',
				required: true
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: "Find tasks",
						value: ClockifyFunctions.FIND_TASKS
					},
					{
						name: "Create task",
						value: ClockifyFunctions.CREATE_TASK
					},
					{
						name: "Update task",
						value: ClockifyFunctions.UPDATE_TASK
					},
					{
						name: "Find projects",
						value: ClockifyFunctions.FIND_PROJECTS
					},
					{
						name: "Create project",
						value: ClockifyFunctions.CREATE_PROJECT
					},
					{
						name: "Update project",
						value: ClockifyFunctions.UPDATE_PROJECT
					},
					{
						name: "Find users",
						value: ClockifyFunctions.FIND_USERS
					},
				],
				required: true,
				default: ClockifyFunctions.FIND_TASKS
			},
			{
				displayName: 'Project',
				name: 'projectId',
				type: 'options',
				displayOptions: {
					show: {
						resource: [ 
							ClockifyFunctions.FIND_TASKS, 
							ClockifyFunctions.CREATE_TASK,
							ClockifyFunctions.UPDATE_TASK,
							ClockifyFunctions.UPDATE_PROJECT
						]
					}
				},
				typeOptions: { loadOptionsMethod: 'listProjects', loadOptionsDependsOn: ['workspaceId'] },
				default: ''
			},
			{
				displayName: 'Task Name',
				name: 'taskname',
				type: 'string',
				displayOptions: {
					show: {
						resource: [ 
							ClockifyFunctions.FIND_TASKS, 
							ClockifyFunctions.CREATE_TASK,
							ClockifyFunctions.UPDATE_TASK
						 ]
					}
				},
				default: ''
			},
			{
				displayName: 'Task Id',
				name: 'taskid',
				type: 'string',
				displayOptions: {
					show: {
						resource: [ 
							ClockifyFunctions.UPDATE_TASK
						 ]
					}
				},
				default: ''
			},
			{
				displayName: 'Task Status',
				name: 'taskstatus',
				type: 'string',
				displayOptions: {
					show: {
						resource: [ 
							ClockifyFunctions.UPDATE_TASK
						 ]
					}
				},
				options: [
					{
						name: "Active",
						value: TaskStatus.ACTIVE
					},
					{
						name: "Done",
						value: TaskStatus.DONE
					},
				],
				default: TaskStatus.ACTIVE
			},
			{
				displayName: 'Task Estimate',
				name: 'taskEstimate',
				type: 'string',
				description: 'Format in ISO 8601 (PT2H). See https://en.wikipedia.org/wiki/ISO_8601',
				displayOptions: {
					show: {
						resource: [ 
							ClockifyFunctions.CREATE_TASK,
							ClockifyFunctions.UPDATE_TASK
						 ]
					}
				},
				default: ''
			},
			{
				displayName: 'Project Name',
				name: 'projectName',
				type: 'string',
				displayOptions: {
					show: {
						resource: [ 
							ClockifyFunctions.FIND_PROJECTS,
							ClockifyFunctions.CREATE_PROJECT,
							ClockifyFunctions.UPDATE_PROJECT
						 ]
					}
				},
				default: ''
			},
			{
				displayName: 'Assignee',
				name: 'assigneeId',
				type: 'options',
				displayOptions: {
					show: {
						resource: [ 
							ClockifyFunctions.CREATE_TASK,
							ClockifyFunctions.UPDATE_TASK 
						]
					}
				},
				typeOptions: { loadOptionsMethod: 'listUsers', loadOptionsDependsOn: ['workspaceId'] },
				default: ''
			},
			{
				displayName: 'E-Mail',
				name: 'email',
				type: 'string',
				displayOptions: {
					show: {
						resource: [ 
							ClockifyFunctions.FIND_USERS,
						 ]
					}
				},
				default: ''
			},
		]
	};

	methods = {
		loadOptions: {
			async listWorkspaces(this: ILoadOptionsFunctions) : Promise<INodePropertyOptions[]> {
				const rtv : INodePropertyOptions[] = [];
				const  workspaces: IWorkspaceDto[] = await clockifyApiRequest.call(this,'GET', 'workspaces');
				if(undefined !== workspaces) {
					workspaces.forEach(value => {
						rtv.push(
						{
							name: value.name,
							value: value.id,
						});
					});
				}
				return rtv;
			},
			async listProjects(this: ILoadOptionsFunctions) : Promise<INodePropertyOptions[]> {
				const rtv : INodePropertyOptions[] = [];
				const workspaceId = this.getCurrentNodeParameter('workspaceId')
				if (workspaceId != null) {
					const  projects: IProjectImpl[] = await clockifyApiRequest.call(this,'GET', `workspaces/${workspaceId}/projects?archived=false`);
					if(undefined !== projects) {
						projects.forEach(value => {
							rtv.push(
							{
								name: value.name,
								value: value.id,
							});
						});
					}
				}
				
				return rtv;
			},
			async listUsers(this: ILoadOptionsFunctions) : Promise<INodePropertyOptions[]> {
				const rtv : INodePropertyOptions[] = [];
				const workspaceId = this.getCurrentNodeParameter('workspaceId')
				if (workspaceId != null) {
					const  users: ICurrentUserDto[] = await clockifyApiRequest.call(this,'GET', `workspaces/${workspaceId}/users?page-size=200`);
					if(undefined !== users) {
						users.forEach(value => {
							rtv.push(
							{
								name: value.name,
								value: value.id,
							});
						});
					}
				}
				
				return rtv;
			},
		},
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const webhookData = this.getWorkflowStaticData('node');
		const apiResource = this.getNodeParameter('resource', 0) as ClockifyFunctions;
		const workspaceId  = this.getNodeParameter('workspaceId', 0);
		

		if (!webhookData.userId) {
			// Cache the user-id that we do not have to request it every time
			const userInfo: ICurrentUserDto = await clockifyApiRequest.call(this, 'GET', 'user');
			webhookData.userId = userInfo.id;
		}

		const qs : IDataObject = {};
		let resource: string;
		let body: {};
		let method: string = 'GET';
		let result = null;
		let projectId: string;
		let projectName: string;
		let taskId: string;
		let taskName: string;
		let taskEstimate: string;
		let taskStatus: TaskStatus;
		let email: string;
		let assigneeId: string;

		switch (apiResource) {
			case ClockifyFunctions.FIND_PROJECTS:
				projectName = encodeURI(this.getNodeParameter('projectName', 0) as string);
				method = 'GET';
				resource = `/workspaces/${workspaceId}/projects?name=${projectName}`
				break;

			case ClockifyFunctions.CREATE_TASK :
				projectId = this.getNodeParameter('projectId', 0) as string;
				taskName  = this.getNodeParameter('taskname', 0) as string;
				taskEstimate = this.getNodeParameter('taskEstimate', 0) as string;
				assigneeId = this.getNodeParameter('assigneeId', 0) as string;
				method = 'POST';
				resource = `/workspaces/${workspaceId}/projects/${projectId}/tasks`
				body = <TaskRequest>{
					name: taskName,
					projectId: projectId,
					estimate: taskEstimate,
					assigneeIds: [ assigneeId ]
				}
				break;

			case ClockifyFunctions.UPDATE_TASK:
				projectId = this.getNodeParameter('projectId', 0) as string;
				taskId  = this.getNodeParameter('taskid', 0) as string;
				taskName  = this.getNodeParameter('taskname', 0) as string;
				taskEstimate = this.getNodeParameter('taskEstimate', 0) as string;
				taskStatus = this.getNodeParameter('taskstatus', 0) as TaskStatus;
				assigneeId = this.getNodeParameter('assigneeId', 0) as string;
				method = 'PUT';
				resource = `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
				body = <TaskRequest> {
					name: taskName,
					estimate: taskEstimate,
					status: taskStatus,
					assigneeIds: [ assigneeId ]
				}
				break;
			
			case ClockifyFunctions.FIND_USERS:
				email = this.getNodeParameter('email', 0) as string;
				resource = `/workspaces/${workspaceId}/users?email=${email}`
				break;

			case ClockifyFunctions.CREATE_PROJECT:
				projectName = this.getNodeParameter('projectName', 0) as string;
				resource = `/workspaces/${workspaceId}/projects`
				method = 'POST';
				body = <IAddProject> {
					name: projectName,
					note: "Created via n8n.",
					billable: false,
					isPublic: true
				}
				break;
			
			case ClockifyFunctions.UPDATE_PROJECT:
				projectId = this.getNodeParameter('projectId', 0) as string;
				projectName = this.getNodeParameter('projectName', 0) as string;
				method = 'PUT';
				resource = `/workspaces/${workspaceId}/projects/${projectId}`
				body = <IAddProject> {
					name: projectName
				}
				break;

			case ClockifyFunctions.FIND_USERS:
                email = this.getNodeParameter('email', 0) as string;
                resource = `/workspaces/${workspaceId}/users?email=${email}`;
                break;
		
			case ClockifyFunctions.FIND_TASKS :
			default:
				projectId  = this.getNodeParameter('projectId', 0) as string;
				taskName  = this.getNodeParameter('taskname', 0) as string;
				resource = `/workspaces/${workspaceId}/projects/${projectId}/tasks`
				if (taskName) {
					qs.name = taskName
				}
				break;
		}

		result = await clockifyApiRequest.call(this, method, resource, body, qs);
		let returnItems = [];

		if (Array.isArray(result) && result.length !== 0) {
			returnItems = this.helpers.returnJsonArray(result);
		} else {
			returnItems = this.helpers.returnJsonArray([{}]);
		}

		return this.prepareOutputData(returnItems);
	}
}
