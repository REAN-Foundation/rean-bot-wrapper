export interface feedbackInterface{
    checkIntentAndSendFeedback (intent,message,client,platformMessageService)
    triggerFeedbackIntent(intent,message,client,platformMessageService)
}