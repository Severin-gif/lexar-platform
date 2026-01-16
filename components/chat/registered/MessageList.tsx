"use client";

import React from "react";
import MessageItem, { Msg } from "./MessageItem";

type Props = {
  messages: Msg[];
  searchQuery: string;
  onClarify: (text: string) => void;
};

// forwardRef нужен RegisteredChat для автоскролла
const MessageList = React.forwardRef<HTMLDivElement, Props>(
  ({ messages, searchQuery, onClarify }, ref) => {
    return (
      <div
        ref={ref}
        className="h-full w-full overflow-y-auto px-0 py-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-[#A4A4A4]">
            Начните диалог — задайте первый вопрос.
          </div>
        ) : (
          messages.map((m) => (
            <MessageItem
              key={m.id}
              message={m}
              searchQuery={searchQuery}
              onClarify={onClarify}
            />
          ))
        )}
      </div>
    );
  }
);

MessageList.displayName = "MessageList";

export default MessageList;
export type { Msg };
