export interface Dose {
    dose: string;
    count: number;
}

export interface Duration {
    unit: string;
    amount: number;
}

export interface MedicineName {
    DrugName: string;
    OtherInformation: string;
}

export interface MedicationDomainModel {
    EhrId?                    : string;
    PatientUserId?            : string;
    MedicalPractitionerUserId?: string;
    VisitId?                  : string;
    OrderId?                  : string;
    DrugName?                 : string;
    DrugId?                   : string;
    Dose?                     : number;
    DosageUnit?               : string;
    TimeSchedules?            : string[];
    Frequency?                : number;
    FrequencyUnit?            : string;
    Route?                    : MedicationAdministrationRoutes;
    Duration?                 : number;
    DurationUnit?             : string;
    StartDate?                : string;
    EndDate?                  : string;
    Instructions?             : string;
    ImageResourceId?          : string;
    IsExistingMedication?     : boolean;
    TakenForLastNDays?        : number;
    ToBeTakenForNextNDays?    : number;
    IsCancelled?              : boolean;
}

export enum MedicationAdministrationRoutes {
    Oral          = 'Oral',
    Intravenous   = 'Intravenous',
    Intramuscular = 'Intramuscular',
    Subcutaneous  = 'Subcutaneous',
    Inhalation    = 'Inhalation',
    Intranasal    = 'Intranasal',
    InLeftEar     = 'In left ear',
    InRightEar    = 'In right ear',
    InBothEars    = 'In both ears',
    InLeftEye     = 'In left eye',
    InRightEye    = 'In right eye',
    InBothEyes    = 'In both eyes',
    Transdermal   = 'Transdermal',
    Vaginally     = 'Vaginally',
    Rectally      = 'Rectally',
    PerNGTube     = 'Per NG tube',
    Intraosseous  = 'Intraosseous',
}

export const MedicationAdministrationRoutesList: MedicationAdministrationRoutes [] = [
    MedicationAdministrationRoutes.Oral,
    MedicationAdministrationRoutes.Intravenous,
    MedicationAdministrationRoutes.Intramuscular,
    MedicationAdministrationRoutes.Subcutaneous,
    MedicationAdministrationRoutes.Inhalation,
    MedicationAdministrationRoutes.Intranasal,
    MedicationAdministrationRoutes.InLeftEar,
    MedicationAdministrationRoutes.InRightEar,
    MedicationAdministrationRoutes.InBothEars,
    MedicationAdministrationRoutes.InLeftEye,
    MedicationAdministrationRoutes.InRightEye,
    MedicationAdministrationRoutes.InBothEyes,
    MedicationAdministrationRoutes.Transdermal,
    MedicationAdministrationRoutes.Vaginally,
    MedicationAdministrationRoutes.Rectally,
    MedicationAdministrationRoutes.PerNGTube,
    MedicationAdministrationRoutes.Intraosseous,
];

export enum DateStringFormat {
    YYYY_MM_DD = 'YYYY-MM-DD'
}
