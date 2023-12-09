import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { CommaSeparatedListOutputParser } from "langchain/schema/output_parser";
import { inject, Lifecycle, scoped } from 'tsyringe';


export class DecisionRouter {


    public model = new ChatOpenAI({ temperature: 0, modelName: "gpt-3.5-turbo" });

    async makeDecision(userQuery: string) {
        console.log("In the decision router");

        const promptTemplate = PromptTemplate.fromTemplate(
            `Given the user question and the previous conversational history below, classify based on the given array below.
            ["faq's", "asessments", "reminders", "other"]

            Here is the context of how you will classify.
            1. If the user is asking a question then classify it as faq's.
            2. If the user is requesting to register to a careplan or if the user has previously registered for a careplan, the bot will send timely messages which maybe a question that would require the user to provide an answer.
            There might be follow up questions to this question as well. So if the conversation seems to be relevant to this case classify it as assessments.
            3. If the user is asking to set a reminder or a task then classify it as reminders. We do send the reminders to the user which might require the user to give a response.
            If the conversation is in line with this, then also classify it as reminders.
            
            Return only one topic that matches closesly as a string.
            For example, if the user query is "What is the meaning of life?" and the classification is "faq's", then return "faq's".
            If the classification is "other" then return "other".
            
            User Query:
            {question}
            
            Conversation History:
                Human: Hello
                Bot: Welcome to our chatbot, here you can ask queries, register to careplans and set any reminders.
            
            <question>
            {question}
            </question>
            
            Classification:
            `
        );

        // const model = new ChatOpenAI({ temperature: 0, modelName: "gpt-3.5-turbo" });

        const chain = promptTemplate.pipe(this.model);

        const result = await chain.invoke({ question: userQuery });

        const output_parser = new CommaSeparatedListOutputParser();
        console.log("The result is ", result.lc_kwargs.content);
        console.log(typeof(result.lc_kwargs.content));

        const tags = output_parser.parse(result.lc_kwargs.content);

        console.log("The tags detected are ", tags);
        console.log(typeof(tags));
        console.log(tags[0]);

        // Tags would be an array of strings: ["faq's", "asessments", "reminders"]
        return tags;
    }
}
