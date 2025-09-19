export interface IEventConsumer {
    
    startListening(): Promise<void>;
    
    stopListening(): Promise<void>;
       
    close(): Promise<void>;
}
