import { Injectable, Logger } from "@nestjs/common";
import { JwksClient } from "jwks-rsa";
import * as jwt from "jsonwebtoken";

export interface WsJwtPayload {
  sub: string;
  preferred_username?: string;
}

@Injectable()
export class WsJwtService {
  private readonly logger = new Logger(WsJwtService.name);
  private readonly jwksClient: JwksClient;

  constructor() {
    const realm = process.env.KEYCLOAK_REALM ?? "crash-game";
    this.jwksClient = new JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: `${process.env.KEYCLOAK_URL}/realms/${realm}/protocol/openid-connect/certs`,
    });
  }

  async verify(token: string): Promise<WsJwtPayload | null> {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
        return null;
      }

      const signingKey = await this.jwksClient.getSigningKey(decoded.header.kid);
      const publicKey = signingKey.getPublicKey();

      const payload = jwt.verify(token, publicKey, {
        algorithms: ["RS256"],
      }) as WsJwtPayload;

      return payload.sub ? payload : null;
    } catch (err) {
      this.logger.warn(`WS JWT verification failed: ${(err as Error).message}`);
      return null;
    }
  }
}
