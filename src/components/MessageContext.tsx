import React, { useState, useContext, useCallback } from 'react';

const MessageContext = React.createContext<MessageContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MessageContextProvider = ({ children }: any) => {
    const [messages, setMessages] = useState<MessageType[]>([]);

    const addMessage = useCallback((message: MessageType) => {
        setMessages((prev) => [...prev, { ...message, id: Date.now() }]);
    }, []);

    const removeMessage = useCallback((id: number) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, []);

    return (
        <MessageContext.Provider value={{ messages, addMessage, removeMessage }}>
            {children}
        </MessageContext.Provider>
    );
};

// Custom hook to easily consume the context in functional components
export const useMessageQueue = () => {
    const context = useContext(MessageContext);
    
    if (!context) {
        throw new Error("useMessageQueue must be used inside the MessageContextProvider");
    }

    return context;
}
