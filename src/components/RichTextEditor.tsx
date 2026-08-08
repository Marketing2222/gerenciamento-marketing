'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  editable?: boolean
}

export default function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sincronizar conteúdo se mudar externamente (ex: abrir outra tarefa)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return <div className="h-28 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg border border-slate-200 dark:border-slate-700" />
  }

  return (
    <div className="w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition duration-200 max-w-full">
      {editable && (
        <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-[#0e1424] border-b border-slate-200 dark:border-slate-800 flex-wrap">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer ${
              editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold' : ''
            }`}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer ${
              editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer ${
              editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Lista de Marcadores"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer ${
              editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Lista Numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
            title="Desfazer"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
            title="Refazer"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className={`p-4 bg-white dark:bg-[#0c1220] overflow-hidden ${editable ? 'min-h-[140px]' : ''}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
