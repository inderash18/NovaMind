import logging
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger("aetheros.core.websocket_manager")

class ConnectionManager:
    """
    Manages active WebSocket connections mapped by session boundaries,
    supporting multi-tab synchronization and global metrics broadcasting.
    """

    def __init__(self):
        # Map session_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
        # Map global system listeners
        self.global_listeners: List[WebSocket] = []

    async def connect(self, session_id: str, websocket: WebSocket, is_global_monitor: bool = False):
        """
        Accepts and registers an incoming WebSocket.
        """
        await websocket.accept()
        
        if is_global_monitor:
            self.global_listeners.append(websocket)
            logger.info("New global telemetry listener connected via WebSocket.")
        else:
            if session_id not in self.active_connections:
                self.active_connections[session_id] = []
            self.active_connections[session_id].append(websocket)
            logger.info(f"Client joined session channel: {session_id}. Active sockets in channel: {len(self.active_connections[session_id])}")

    def disconnect(self, session_id: str, websocket: WebSocket, is_global_monitor: bool = False):
        """
        Gracefully removes a connection from the tracking registry on closure.
        """
        if is_global_monitor:
            if websocket in self.global_listeners:
                self.global_listeners.remove(websocket)
            logger.info("Global telemetry listener disconnected.")
        else:
            if session_id in self.active_connections:
                if websocket in self.active_connections[session_id]:
                    self.active_connections[session_id].remove(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
                logger.info(f"Client disconnected from session channel: {session_id}.")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """
        Transmits a direct private frame payload to a single specific connection.
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to transmit direct WS message: {e}")

    async def send_json_to_session(self, session_id: str, message: Dict[str, Any]):
        """
        Broadcasts an envelope JSON structure to all subscribed windows of a particular session.
        """
        if session_id not in self.active_connections:
            return

        dead_connections = []
        for connection in self.active_connections[session_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed writing json to session client socket {session_id}: {e}. Queuing for cleanup.")
                dead_connections.append(connection)

        # Immediate pruning of closed/dead connection channels
        for dead in dead_connections:
            self.disconnect(session_id, dead)

    async def broadcast_global_json(self, message: Dict[str, Any]):
        """
        Pushes system telemetry updates (VRAM, providers) to all connected clients.
        """
        # Broadcast to all active session interfaces
        for session_id, connections in list(self.active_connections.items()):
            dead_connections = []
            for conn in connections:
                try:
                    await conn.send_json(message)
                except Exception:
                    dead_connections.append(conn)
            for dead in dead_connections:
                self.disconnect(session_id, dead)

        # Broadcast to dedicated system monitor portals
        dead_monitors = []
        for monitor in self.global_listeners:
            try:
                await monitor.send_json(message)
            except Exception:
                dead_monitors.append(monitor)
        for dead in dead_monitors:
            self.disconnect("", dead, is_global_monitor=True)

# Central Singleton Instance
ws_manager = ConnectionManager()
