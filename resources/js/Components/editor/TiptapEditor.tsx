import './TiptapEditor.css';
import 'tippy.js/dist/tippy.css';
import React, { createRef, useEffect, useRef, useState } from 'react';
import CannedResponsePicker from './CannedResponsePicker';
import { createRoot } from 'react-dom/client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExt from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Mention from '@tiptap/extension-mention';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import MentionList, { type MentionListHandle, type MentionItem } from './MentionList';

interface Props {
    content:     string;
    onChange:    (html: string) => void;
    placeholder?: string;
    minHeight?:  number;
    editable?:   boolean;
    ticketId?:   number;
}

function Btn({ onClick, active, title, children }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
    return (
        <button type="button" onMouseDown={(e) => { e.preventDefault(); onClick(); }} title={title}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors select-none ${active ? 'bg-primary-100 text-primary-700' : 'text-[--color-text-muted] hover:bg-[--color-bg] hover:text-[--color-text]'}`}>
            {children}
        </button>
    );
}

const SEP = () => <span className="w-px h-4 bg-[--color-border] mx-0.5 flex-shrink-0" />;

const MentionExtension = Mention.configure({
    HTMLAttributes: { class: 'mention' },
    suggestion: {
        items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
            if (query.length < 1) return [];
            try {
                const res = await window.axios.get('/users/mention-search', { params: { q: query } });
                return res.data as MentionItem[];
            } catch {
                return [];
            }
        },
        render: () => {
            let popup: TippyInstance | null = null;
            let reactRoot:   ReturnType<typeof createRoot> | null = null;
            const container = document.createElement('div');
            const listRef   = createRef<MentionListHandle>();

            return {
                onStart: (props) => {
                    reactRoot = createRoot(container);
                    reactRoot.render(
                        React.createElement(MentionList, { ref: listRef, items: props.items as MentionItem[], command: props.command }),
                    );

                    const instances = tippy('body', {
                        getReferenceClientRect: props.clientRect as () => DOMRect,
                        appendTo: () => document.body,
                        content: container,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    });
                    popup = Array.isArray(instances) ? instances[0] : instances;
                },
                onUpdate: (props) => {
                    reactRoot?.render(
                        React.createElement(MentionList, { ref: listRef, items: props.items as MentionItem[], command: props.command }),
                    );
                    popup?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
                },
                onKeyDown: (props) => {
                    if (props.event.key === 'Escape') { popup?.hide(); return true; }
                    return listRef.current?.onKeyDown(props) ?? false;
                },
                onExit: () => {
                    popup?.destroy();
                    reactRoot?.unmount();
                },
            };
        },
    },
});

export default function TiptapEditor({ content, onChange, placeholder = 'Write something…', minHeight = 150, editable = true, ticketId }: Props) {
    const [showCanned, setShowCanned] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
            LinkExt.configure({ openOnClick: false }),
            Underline,
            MentionExtension,
        ],
        content,
        editable,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    useEffect(() => {
        if (editor && content === '') {
            editor.commands.clearContent(false);
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="border border-[--color-border] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-shadow">
            {editable && (
                <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-[--color-border] bg-[--color-bg]">
                    <Btn onClick={() => editor.chain().focus().toggleBold().run()}              active={editor.isActive('bold')}                  title="Bold"><strong>B</strong></Btn>
                    <Btn onClick={() => editor.chain().focus().toggleItalic().run()}            active={editor.isActive('italic')}                title="Italic"><em>I</em></Btn>
                    <Btn onClick={() => editor.chain().focus().toggleUnderline().run()}         active={editor.isActive('underline')}             title="Underline"><u>U</u></Btn>
                    <Btn onClick={() => editor.chain().focus().toggleStrike().run()}            active={editor.isActive('strike')}                title="Strikethrough"><s>S</s></Btn>
                    <SEP />
                    <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</Btn>
                    <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</Btn>
                    <SEP />
                    <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}        active={editor.isActive('bulletList')}            title="Bullet list">• List</Btn>
                    <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()}       active={editor.isActive('orderedList')}           title="Ordered list">1. List</Btn>
                    <SEP />
                    <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()}        active={editor.isActive('blockquote')}            title="Blockquote">" Quote</Btn>
                    <Btn onClick={() => editor.chain().focus().toggleCode().run()}              active={editor.isActive('code')}                  title="Code">{`<>`}</Btn>
                    <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()}         active={editor.isActive('codeBlock')}             title="Code block">≡ Code</Btn>
                    <SEP />
                    <span className="text-[10px] text-[--color-text-subtle] px-1">@ to mention</span>
                    <SEP />
                    <div className="relative" ref={toolbarRef}>
                        <Btn onClick={() => setShowCanned(v => !v)} active={showCanned} title="Insert canned response">
                            ≡ Canned
                        </Btn>
                        {showCanned && (
                            <CannedResponsePicker
                                ticketId={ticketId}
                                onInsert={(html) => {
                                    editor.chain().focus().insertContent(html).run();
                                    onChange(editor.getHTML());
                                }}
                                onClose={() => setShowCanned(false)}
                            />
                        )}
                    </div>
                </div>
            )}
            <EditorContent editor={editor} className="px-4 py-3 text-sm text-[--color-text]" style={{ minHeight }} />
        </div>
    );
}
