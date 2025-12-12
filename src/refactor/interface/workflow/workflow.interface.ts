/**
 * Workflow Models
 * Type Definitions for workflow schemas and API Response
 */
export interface LocationValue {
    Longitude: number | null;
    Latitude: number | null;
}

export interface ContextParam {
    Name: string;
    Type: string;
    Description: string;
    Value: any;
    Key: string;
    Required?: boolean;
    ComparisonThreshold?: number;
    ComparisonUnit?: string;
}

export interface ContextParams {
    Name: string;
    Params: ContextParam[];
}

export interface ActionParam {
    Key: string;
    Name: string;
    Type: string;
    Value: any;
    Required?: boolean;
    Description?: string;
    Source?: string;
    Destination?: string;
    ActionType?: string;
}

export interface ActionInput {
    Params: ActionParam[];
}

export interface ActionOutput {
    Params: ActionParam[];
}

export interface NodeAction {
    id: string;
    Sequence: number;
    Type: string;
    IsPathAction: boolean;
    Name: string;
    Description: string | null;
    ParentNode: string | null;
    Input: ActionInput | null;
    Output: ActionOutput | null;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface RootNode {
    id: string;
    Description: string;
    Name: string;
    Type: string;
    Actions: NodeAction[];
    NextNodeId: string | null;
}

export interface Schema {
    id: string;
    Type: string;
    TenantId: string;
    TenantCode: string;
    Name: string;
    Description: string;
    ParentSchemaId: string | null;
    ExecuteImmediately: boolean;
    RootNode: RootNode | null;
    ContextParams: ContextParams;
    RoutingPrompt?: string;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface ApiResponse {
    Status: string;
    Message: string;
    HttpCode: number;
    Data: Schema;
    Client: {
        Name: string;
        Code: string;
        IsPrivileged: boolean;
    };
    Context: string;
    ClientIps: string[];
    APIVersion: string;
}

export interface MultiSchemaApiResponse {
    Status: string;
    Message: string;
    HttpCode: number;
    Data: {
        TotalCount: number;
        RetrievedCount: number;
        PageIndex: number;
        ItemsPerPage: number;
        Order: string;
        OrderedBy: string;
        Items: Schema[];
    };
    Client: {
        Name: string;
        Code: string;
        IsPrivileged : boolean;
    };
    Context: string;
    ClientIps: string[];
    APIVersion: string;
}

export interface WorkflowRoutingResult {
    flag: string;
    reason: string;
    mathcedSchemaId: string | null;
}

export interface RoutingDecision {
    shouldTrigger: boolean;
    reason: string;
    matchedSchemaId: string | null;
    matchedSchema?: Schema;
}