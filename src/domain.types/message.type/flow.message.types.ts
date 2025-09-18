export interface TextHeader {
    type: "text";
    text: string;
  }
  
export interface ImageHeader {
    type: "image";
    image: { link: string };
    }

export interface VideoHeader {
    type: "video";
    video: { link: string };
    }

export interface DocumentHeader {
    type: "document";
    document: { link: string; filename: string };
    }

export type Header = TextHeader | ImageHeader | VideoHeader | DocumentHeader;

export interface FlowMessageParts {
    Header?: Header;
    Body: { text: string };
    Footer: { text: string };
    ActionVersion?: string;
    Cta?: string;
    Screen?: string;
  }
            
export enum FlowActionType {
    Navigate = 'navigate',
    DataExchange = 'data_exchange',
    Open = 'open',
    Close = 'close',
    Back = 'back',
    Refresh = 'refresh'
}
