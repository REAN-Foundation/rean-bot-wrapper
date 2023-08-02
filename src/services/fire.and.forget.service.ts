import * as asyncLib from 'async';
import { Lifecycle, scoped, inject } from 'tsyringe';
import { RegistrationService } from './maternalCareplan/registration.service';
import { NeedBloodService } from './bloodWrrior/need.blood.service';
import { CreateReminderService } from './medicationReminder/create.reminder.service';
import { EnrollPatientService } from './bloodWrrior/enroll.service';

export interface QueueDoaminModel {
    Intent : string;
    Body   : any;
}

///////////////////////////////////////////////////////////////////////////////////

const ASYNC_TASK_COUNT = 4;

@scoped(Lifecycle.ContainerScoped)
export class FireAndForgetService {

    //#region Task queue

    static _q = asyncLib.queue((model: QueueDoaminModel, onCompleted) => {
        (async () => {
            await FireAndForgetService.queueTask(model);
            onCompleted(model);
        })();
    }, ASYNC_TASK_COUNT);
  
    public static enqueue = (model: QueueDoaminModel) => {
        FireAndForgetService._q.push(model, (model, error) => {
            if (error) {
                console.log(`Error recording Fire and Forget Service: ${JSON.stringify(error)}`);
                console.log(`Error recording Fire and Forget Service: ${JSON.stringify(error.stack, null, 2)}`);
            }
            else {
                console.log(`Fire and Forget Domain Model: ${model}`);
            }
        });
    };

    public static delay = ms => new Promise(res => setTimeout(res, ms));

    //#region Private static methods

    private static queueTask = async(model: QueueDoaminModel) => {

        if (model.Intent === "RegistrationDMC") {
            const eventObj = model.Body.EventObj;
            const _registrationService:  RegistrationService = eventObj.container.resolve(RegistrationService);
            await _registrationService.enrollPatientService(model.Body.PatientUserId,
                model.Body.Name,model.Body.LMP, eventObj );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "NeedBlood_Patient_Confirm_Yes") {
            const eventObj = model.Body.EventObj;
            const _needBloodService:  NeedBloodService = eventObj.container.resolve(NeedBloodService);
            await _needBloodService.needBloodNotifyVolunteer(model.Body, eventObj );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "M_Medication_Data_Yes") {
            const eventObj = model.Body.EventObj;
            const _createReminderService:  CreateReminderService = eventObj.container.resolve(CreateReminderService);
            await _createReminderService.sendReminder(model.Body, eventObj );
            console.log(`Fire and Forget Domain Model: ${model}`);
        }
        if (model.Intent === "Change_TF_Date_Load_Reminders") {
            const eventObj = model.Body.EventObj;
            const _enrollPatientService:  EnrollPatientService = eventObj.container.resolve(EnrollPatientService);
            await _enrollPatientService.enrollPatientService(eventObj );

            console.log(`Fire and Forget Domain Model: ${model}`);
        }
    };

    //#endregion
    
}
