import { CareplanEnrollmentDomainModel, CareplanIntentMetadata } from "../../domain.types/basic.careplan/careplan.types";

export class CareplanMetaDataValidator {

    static validate = (metadata: any ) : CareplanIntentMetadata => {
        if (!metadata) {
            throw new Error("Metadata is required");
        }

        if (!metadata.Message) {
            throw new Error("For Basic Careplan, Metadata.Message is required");
        }

        if (!metadata.MessageType) {
            throw new Error("For Basic Careplan, Metadata.MessageType is required");
        }

        switch (metadata.MessageType) {

        case "text":

            // No special validation needed
            break;

        case "interactivebuttons":
        case "inline_keyboard":
            if (!metadata.Buttons || metadata.Buttons.length === 0) {
                throw new Error(`For careplan, ${metadata.MessageType} requires at least one button`);
            }
            metadata.Buttons.forEach((btn, i) => {
                if (!btn.Title || !btn.id) {
                    throw new Error(`Button at index ${i} must have both title and id`);
                }
            });
            break;

        case "template":
            if (!metadata.TemplateName) {
                throw new Error("TemplateName is required when MessageType = 'template'");
            }

            // Buttons may or may not exist — allowed
            break;

        default:
            throw new Error(`Invalid MessageType: ${metadata.MessageType}`);
        }

        const result: CareplanIntentMetadata = {
            Message      : metadata.Message,
            MessageType  : metadata.MessageType,
            TemplateName : metadata.TemplateName ?? null,
            Buttons      : metadata.Buttons ?? [],
            Variables    : metadata.Variables ?? {},
        };

        return result;
    };

    static validatecareplanEnrollment = (metadata: CareplanEnrollmentDomainModel) => {
        if (!metadata) {
            throw new Error("For careplan enrollment, Metadata is required");
        }

        if (!metadata.Provider) {
            throw new Error("Careplan Enrollment Metadata.Provider is required");
        }

        if (!metadata.PlanCode) {
            throw new Error("Careplan Enrollment Metadata.PlanCode is required");
        }

        if (!metadata.PlanName) {
            metadata.PlanName = metadata.PlanCode;
        }

        const model : CareplanEnrollmentDomainModel = {
            Provider   : metadata.Provider,
            PlanCode   : metadata.PlanCode,
            PlanName   : metadata.PlanName,
            Language   : metadata.Language ?? 'en',
            StartDate  : metadata.StartDate ?? null,
            DayOffset  : metadata.DayOffset ?? 0,
            Channel    : metadata.Channel,
            TenantName : metadata.TenantName,
            IsTest     : metadata.IsTest ?? false,
        };
        return model;
    };

}
