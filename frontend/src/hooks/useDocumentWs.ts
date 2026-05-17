import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import * as Y from "yjs";
import SockJS from 'sockjs-client';

function toBase64(arr: Uint8Array) {
  let binary = "";
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default function useDocumentWS(
  documentId: string,
  token: string | null,
) {
  const [connected, setConnected] = useState(false);
  const [yDoc] = useState(() => new Y.Doc());
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !documentId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/doc/${documentId}`, (msg) => {
          const bytes = fromBase64(msg.body);
          Y.applyUpdate(yDoc, bytes, "remote");
        });
        client.subscribe(`/topic/doc/${documentId}/presence`, (msg) => {
          const users = JSON.parse(msg.body);
          setOnlineUsers(users);
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
    });
    client.activate();

    yDoc.on('update', (update, origin) => {
      if (origin === 'remote') return;
      const bytes = toBase64(Y.encodeStateAsUpdate(yDoc));
      client.publish({
        destination: `/app/doc/${documentId}/edit`,
        body: bytes,
      });
    });
    return () => {
        client.deactivate();
        yDoc.destroy();
    }
  }, [documentId, token, yDoc]);
  return { yDoc, connected, onlineUsers };
}
