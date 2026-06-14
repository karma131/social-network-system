export type ChatMessageType = 'text' | 'image' | 'file' | 'video' | 'system';

export type ReactionKey = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface ReplyContextDTO {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video';
}

export interface MessageReactionDTO {
  userId: string;
  userName: string;
  emoji: ReactionKey;
}

export interface ChatMessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  type: ChatMessageType;
  replyTo?: ReplyContextDTO;
  editedAt?: number;
  deleted?: boolean;
  reactions?: MessageReactionDTO[];
}

// `nextCurosr` typo is intentional — matches the FE infinite-query wire contract.
export interface ChatHistoryResponseDTO {
  messages: ChatMessageDTO[];
  nextCurosr: number | null;
  nextCursorId: string | null;
  hasMore: boolean;
}
