/**
 * Workflow Helpers
 * Utility functions for workflow data manipulation and extraction
 */

import { ApiResponse, ContextParam, MultiSchemaApiResponse, Schema } from "../../refactor/interface/workflow/workflow.interface";

/**
 * Extracts schemas from various input formats
 * @param apiResponse - Can be single schema, array of schemas or API Response 
 * @returns Array of Schema objects
 */

export function extractSchemas(
    apiResponse: ApiResponse | MultiSchemaApiResponse | Schema | Schema[]
): Schema[] {

    // If it is already an array of schemas
    if (Array.isArray(apiResponse)) {
        return apiResponse;
    }

    // If it's a single schema object
    if ('id' in apiResponse && 'ContextParams' in apiResponse) {
        return [apiResponse as Schema];
    }

    // If it's a multi-schema API Response
    if ('Data' in apiResponse && 'Items' in (apiResponse as MultiSchemaApiResponse).Data) {
        return (apiResponse as MultiSchemaApiResponse).Data.Items;
    }

    // If it's a single schema API Response
    if ('Data' in apiResponse && 'id' in (apiResponse as ApiResponse).Data) {
        return [(apiResponse as ApiResponse).Data];
    }

    return [];
}

/**
 * Gets all required parameters from a schema
 * @param schema - Schema object
 * @returns Array of required ContextParam objects
 */
export function getRequiredParams(schema: Schema): ContextParam[] {
    return schema.ContextParams.Params.filter(p => p.Required);
}

/**
 * Gets a specific parameter by its key
 * @param schema - Schema object
 * @param key - Parameter key to search for
 * @returns ContextParam object or undefined
 */
export function getParamByKey(schema: Schema, key: string): ContextParam | undefined {
    return schema.ContextParams.Params.find(p => p.Key === key);
}

/**
 * Get all parameters from a schema
 * @param schema - Schema object
 * @returns Array of all ContextParam objects
 */
export function getAllParams(schema: Schema): ContextParam[] {
    return schema.ContextParams.Params;
}

/**
 * Get parameters by type
 * @param schema - Schema object
 * @param type - Parameter type of filter by
 * @returns Array of ContextParam objects matching the type
 */
export function getParamsByType(schema: Schema, type: string): ContextParam[] {
    return schema.ContextParams.Params.filter(p => p.Type === type);
}

/**
 * Checks if a schema has a specific parameter
 * @param schema - Schema object
 * @param key - Parameter key to check
 * @returns boolean indicating if parameter exists
 */
export function hasParam(schema: Schema, key: string): boolean {
    return schema.ContextParams.Params.some(p => p.Key === key);
}

/**
 * Finds a schema by its id from an array
 * @param schemas - Array of Schema objects
 * @param schemaId - Schema id to search for
 * @returns Schema object or undefined
 */
export function findSchemaById(schemas: Schema[], schemaId: string): Schema | undefined {
    return schemas.find(s => s.id === schemaId);
}

/**
 * Builds a human-readable summary of a workflow
 * @param schema - Schema object
 * @returns Formatted string summary
 */
export function buildWorkflowSummary(schema: Schema): string {
    const requiredParams = schema.ContextParams.Params
        .filter(p => p.Required)
        .map(p => `${p.Name} (${p.Type})`)
        .join(', ');
    
    const allParams = schema.ContextParams.Params
        .map(p => `${p.Name} (${p.Type})${p.Required ? ' [REQUIRED]' : ''}`)
        .join(', ');
    
    return `
WORKFLOW ${schema.id}:
Name: ${schema.Name}
Description: ${schema.Description}

${schema.RoutingPrompt ? `ROUTING CRITERIA:
${schema.RoutingPrompt}
` : 'No specific routing criteria provided.'}

Parameters Expected:
- Required: ${requiredParams || 'None'}
- All Available: ${allParams || 'None'}
`;
}

/**
 * Validates if a schema has all required fields
 * @param schema - Schema object
 * @returns boolean indicating if schema is valid
 */
export function isValidSchema(schema: Schema): boolean {
    return !!(
        schema.id &&
        schema.Name &&
        schema.Description &&
        schema.ContextParams &&
        Array.isArray(schema.ContextParams.Params)
    );
}

/**
 * Gets schemas that should execute immediately
 * @param schemas - Array of Schema objects
 * @returns Array of schemas with ExecuteImmediately = true
 */
export function getImmediateExecutionSchemas(schemas: Schema[]): Schema[] {
    return schemas.filter(s => s.ExecuteImmediately);
}