import { Response } from 'express';  // 상단에 추가

export class SSEManager {
    private static clients: Map<string, Response> = new Map();
  
    static addClient(uuid: string, res: Response) {
      // SSE 헤더 설정
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        // 'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
        // 'Access-Control-Allow-Credentials': 'true'
      });
  
      // 연결 시작 메시지
      res.write(`data: ${JSON.stringify({ type: 'connected', uuid })}\n\n`);
  
      // 클라이언트 저장
      this.clients.set(uuid, res);
  
      // 연결 종료 시 정리
      res.on('close', () => {
        this.clients.delete(uuid);
      });
    }
  
    static sendMessage(uuid: string, data: any) {
      const client = this.clients.get(uuid);
      if (client) {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    }
  }