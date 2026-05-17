import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import useDocumentWS from "@/hooks/useDocumentWs";
import styles from "./editor.module.css";

interface EditorProps {
  documentId: string;
  token: string;
}

export default function Editor({ documentId, token }: EditorProps) {
  const { yDoc, connected, onlineUsers } = useDocumentWS(documentId, token);

  const editor = useEditor({
    extensions: [
        StarterKit.configure({
            undoRedo: false,
        }),
        Collaboration.configure({
            document: yDoc,
      }),
    ],
  });
  return (
    <div className={styles.container}>
      <div className={styles.statusBar}>
        <div className={connected ? styles.statusConnected : styles.statusDisconnected}>
          {connected ? "🟢 Połączono z serwerem" : "🔴 Trwa łączenie..."}
        </div>
        <div>
          <strong>Aktywni użytkownicy: </strong>
          {onlineUsers.length > 0 ? onlineUsers.join(", ") : "Tylko Ty"}
        </div>
      </div>
      <div className={styles.editorWrapper}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
