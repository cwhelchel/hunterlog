
interface MessageType {
    id: number;
    message: string;
    type: number;
    color: string;
}

interface MessageContextType {
    messages: MessageType[];
    addMessage: (msg: MessageType) => void;
    removeMessage: (id: number) => void;
}