import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export type NetworkMessage =
  | { type: 'HANDSHAKE'; payload: { name: string } }
  | { type: 'HANDSHAKE_ACK'; payload: {} }
  | { type: 'GAME_DATA'; payload: any };

type MessageCallback = (data: NetworkMessage) => void;

class NetworkManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onMessage: MessageCallback | null = null;

  public myId: string = '';

  initialize(onId: (id: string) => void) {
    // We can use the default PeerJS public cloud server for simplicity
    this.peer = new Peer();

    this.peer.on('open', (id) => {
      this.myId = id;
      onId(id);
    });

    this.peer.on('connection', (conn) => {
      this.handleConnection(conn);
    });
  }

  connectTo(hostId: string, onConnected: () => void) {
    if (!this.peer) return;
    const conn = this.peer.connect(hostId);
    this.handleConnection(conn);

    conn.on('open', () => {
      onConnected();
    });
  }

  private handleConnection(conn: DataConnection) {
    this.conn = conn;

    conn.on('data', (data: any) => {
      if (this.onMessage) {
        this.onMessage(data as NetworkMessage);
      }
    });

    conn.on('close', () => {
      console.log('Connection Closed');
      this.conn = null;
    });
  }

  sendMessage(msg: NetworkMessage) {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
    }
  }

  setMessageHandler(handler: MessageCallback) {
    this.onMessage = handler;
  }
}

export const networkManager = new NetworkManager();
