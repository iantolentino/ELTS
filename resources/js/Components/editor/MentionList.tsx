import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export interface MentionItem { id: number; label: string; email: string; }

export interface MentionListHandle {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface Props {
    items:   MentionItem[];
    command: (item: MentionItem) => void;
}

const MentionList = forwardRef<MentionListHandle, Props>(({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    const select = (index: number) => {
        const item = items[index];
        if (item) command(item);
    };

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp')   { setSelectedIndex(i => (i + items.length - 1) % Math.max(items.length, 1)); return true; }
            if (event.key === 'ArrowDown') { setSelectedIndex(i => (i + 1) % Math.max(items.length, 1)); return true; }
            if (event.key === 'Enter')     { select(selectedIndex); return true; }
            return false;
        },
    }));

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-[--color-border] shadow-lg py-2 px-3 text-sm text-[--color-text-muted]">
                No users found
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-[--color-border] shadow-lg py-1 min-w-[200px] max-h-56 overflow-y-auto z-50">
            {items.map((item, index) => (
                <button
                    key={item.id}
                    onClick={() => select(index)}
                    className={`w-full flex flex-col px-3 py-2 text-left transition-colors ${index === selectedIndex ? 'bg-primary-50' : 'hover:bg-[--color-bg]'}`}
                >
                    <span className="text-sm font-medium text-[--color-text]">{item.label}</span>
                    <span className="text-xs text-[--color-text-muted]">{item.email}</span>
                </button>
            ))}
        </div>
    );
});

MentionList.displayName = 'MentionList';
export default MentionList;
