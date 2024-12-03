import { scoped, Lifecycle } from 'tsyringe';
import { CacheMemory } from '../cache.memory.service';
import { workflowInterface } from '../../refactor/interface/wrokflow.interface';

@scoped(Lifecycle.ContainerScoped)
export class BaseWorkflow implements workflowInterface {
    
    async startWorkflow(workflowName: string, userId: string, steps: string[]){
        const initialState = { currentStep: steps[0], currentIndex: 0, workflow: { name: workflowName, sequence: steps }, isComplete: false };
        await CacheMemory.set(userId, initialState);
    }

    async next(eventObj: any){
        const userId = eventObj.platformId;
        const state = await CacheMemory.get(userId);
        if (!state || state.isComplete) {
            throw new Error("Workflow has completed or no state found.");
        }

        const currentStep = state.currentStep;
        const result = await this.executeStep(currentStep, eventObj);

        state.currentIndex += 1;
        if (state.currentIndex >= state.workflow.sequence.length) {
            state.isComplete = true;
            await CacheMemory.clear();
        } else {
            state.currentStep = state.workflow.sequence[state.currentIndex];
        }

        await CacheMemory.update(userId, state);
        return result;
    }

    executeStep(step: string, eventObj: any) {
        throw new Error('Method not implemented in child class');
    }
    
}
