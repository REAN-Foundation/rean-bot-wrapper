import { FlowMessageParts } from "../domain.types/message.type/flow.message.types";

export const flowConfigs: Record<string, FlowMessageParts> = {
    Survey_Form : {
        Header        : { type: "text", text: "📝 Registration" },
        Body          : { text: "✨ Please complete your registration to get started!" },
        Footer        : { text: "🙏 Thank you for choosing us!" },
        ActionVersion : "3",
        Cta           : "Open Form",
        Screen        : "QUESTION_ONE"
    },
  
    Registration_Form : {
        Header        : { type: "text", text: "📝 Registration" },
        Body          : { text: "✨ Please complete your registration to get started!" },
        Footer        : { text: "🙏 Thank you for choosing us!" },
        ActionVersion : "3",
        Cta           : "Open Form",
        Screen        : "WELCOME"
    },

    Nayi_Disha_Registration_Form : {
        Header        : { type: "text", text: "📝 Registration" },
        Body          : { text: "✨ Please complete your registration to get started!" },
        Footer        : { text: "🙏 Thank you for choosing us!" },
        ActionVersion : "3",
        Cta           : "Open Form",
        Screen        : "WELCOME"
    },

    Feedback_Form : {
        Header : {
            type  : "image",
            image : { link: "https://example.com/feedback-banner.png" }
        },
        Body          : { text: "💭 We'd love your feedback on our services." },
        Footer        : { text: "❤️ Your opinion matters to us!" },
        ActionVersion : "3",
        Cta           : "Open Form",
        Screen        : "FEEDBACK"
    }
};
  
export function getFlowMessageParts(flowName: string): FlowMessageParts | null {
    if (!flowName) {
        return null;
    }
    return flowConfigs[flowName] || null;
}
  
