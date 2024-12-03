export interface workflowInterface{
    startWorkflow(workflowName:string, userId: string, steps: string[]);
    next(eventObj: any);
    executeStep(step: string, eventObj: any);
}
