
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Part {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

export interface Message {
  role: Role;
  parts: Part[];
}
