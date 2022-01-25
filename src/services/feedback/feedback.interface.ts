export interface feedbackInterface{
    checkIntentAndSendFeedback (intent,message,channel,platformMessageService)
    triggerFeedbackIntent(intent,message,channel,platformMessageService)
}