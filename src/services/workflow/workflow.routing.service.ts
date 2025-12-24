/**
 * Workflow Routing Service
 * Handles routing decision between workflows and LLM Service
 */

import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";

import {
    Schema,
    ApiResponse,
    MultiSchemaApiResponse,
    WorkflowRoutingResult,
    RoutingDecision
} from '../../refactor/interface/workflow/workflow.interface';
import {
    extractSchemas,
    buildWorkflowSummary,
    findSchemaById
} from '../../utils/helpers/workflow.helper';

/**
 * Workflow Routing Service Class
 */

export class WorkflowRoutingService {
    
    private model: ChatOpenAI;
    private promptTemplate: PromptTemplate;

    constructor() {
        
        // Initialize the ChatOpenAI model
        this.model = new ChatOpenAI({
            modelName : "gpt-5-mini"
        });

        this.promptTemplate = PromptTemplate.fromTemplate(`
You are a workflow routing classifier. Analyze the user message and determine if it should trigger a specific workflow or be sent to a general LLM service.

AVAILABLE WORKFLOWS:
{workflow_schema}

GENERAL ROUTING PRINCIPLES:

Route to WORKFLOW (flag: "true") when:
- The user message provides data that matches any workflow parameter (required or optional)
- The message content aligns with a workflow's routing criteria as defined in its RoutingPrompt
- The message contains actionable information that can advance a workflow state
- The message clearly responds to a workflow prompt or question
- The intent is to interact with or progress through a specific workflow

Route to LLM SERVICE (flag: "false") when:
- The message asks informational, educational, or "how-to" questions
- The message seeks general guidance or explanations
- The message is conversational without providing workflow-related data
- The message does not match any workflow's routing criteria
- The message is off-topic or unrelated to any available workflow
- When in doubt about whether data is being provided vs. information being requested

DECISION PROCESS:
1. Read each workflow's RoutingPrompt carefully - this defines what that workflow handles
2. Check if the user message provides any parameter data that workflows expect
3. Evaluate if the message intent matches any workflow's purpose
4. If multiple workflows could match, choose the most specific/appropriate one
5. Default to LLM SERVICE for purely informational queries

OUTPUT FORMAT:
Respond with ONLY valid JSON, no markdown formatting:
{{
    "flag": "true or false",
    "reason": "brief explanation",
    "matchedSchemaId": "Provide the matching WORKFLOW SCHEMA ID or null"
}}

USER MESSAGE: {user_message}

Analyze and provide your routing decision.
        `);
    }

    /**
     * Parses the LLM response to extract routing result
     * @param response - Raw response from LLM
     * @returns Parsed WorkflowRoutingResult
     */
    private parseResponse(response: any): WorkflowRoutingResult {
        try {

            //Extract content from langchain response
            const content = response.lc_kwargs.content;

            const resultText = typeof content === 'string' ? content : JSON.stringify(content);

            return JSON.parse(resultText);
        } catch (error) {
            console.error("Error parsing LLM response:", error);
            throw new Error("Failed to parse LLM response");
        }
    }

    /**
     * Formats schemas for the prompt
     * @param schemas - Array of Schema objects
     * @returns Formatted string representation
     */
    private formatSchemsForPrompt(schemas: Schema[]): string {
        return schemas.map(schema => buildWorkflowSummary(schema)).join('\n---\n');
    }

    async routeMessage(
        userMessage: string,
        apiResponse: ApiResponse | MultiSchemaApiResponse | Schema | Schema[]
    ): Promise<RoutingDecision> {
        const schemas = extractSchemas(apiResponse);

        if (schemas.length === 0) {
            return {
                shouldTrigger   : false,
                reason          : "No workflows available, routing to LLM service",
                matchedSchemaId : null
            };
        }

        try {

            // Create the chain
            const chain = this.promptTemplate.pipe(this.model);

            // Invoke the chain
            const result = await chain.invoke({
                workflow_schema : this.formatSchemsForPrompt(schemas),
                user_message    : userMessage
            });

            console.log("WORKFLOW ROUTING AI RESPONSE", result.lc_kwargs.content);

            // Parse the result
            const parsedResult = this.parseResponse(result);

            const shouldTrigger = parsedResult.flag.toLocaleLowerCase() === "true";
            const matchedSchemaId = parsedResult.matchedSchemaId;

            const matchedSchema = matchedSchemaId ? findSchemaById(schemas, matchedSchemaId) : undefined;

            return {
                shouldTrigger,
                reason : parsedResult.reason,
                matchedSchemaId,
                matchedSchema
            };
        } catch (error) {
            console.error("Error in workflow routing decision:", error);

            return {
                shouldTrigger   : false,
                reason          : "Error occurred, defaulting to LLM Service",
                matchedSchemaId : null
            };
        }
    }
    
}