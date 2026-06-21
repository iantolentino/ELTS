import { ReactNode, useEffect, useRef, useState } from 'react';

interface MenuItem {
    label:     string;
    onClick?:  () => void;
    danger?:   boolean;
    disabled?: boolean;
    separator?: never;
}

interface Separator {
    separator: true;
    label?:    never;
}

export type DropdownItem = MenuItem | Separator;

interface Props {
    trigger: ReactNode;
    items:   DropdownItem[];
    align?:  'left' | 'right';
    width?:  string;
}

export default function Dropdown({ trigger, items, align = 'left', width = 'w-48' }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative inline-block">
            <div onClick={() => setOpen(v => !v)} className="cursor-pointer">
                {trigger}
            </div>

            {open && (
                <div className={`absolute z-30 mt-1 ${width} bg-white border border-[--color-border] rounded-xl shadow-lg py-1 overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}>
                    {items.map((item, i) => {
                        if ('separator' in item && item.separator) {
                            return <hr key={i} className="my-1 border-[--color-border]" />;
                        }
                        const { label, onClick, danger, disabled } = item as MenuItem;
                        return (
                            <button
                                key={i}
                                disabled={disabled}
                                onClick={() => {
                                    if (!disabled && onClick) {
                                        onClick();
                                        setOpen(false);
                                    }
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${danger ? 'text-danger-600 hover:bg-danger-50' : 'text-[--color-text] hover:bg-[--color-bg]'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
