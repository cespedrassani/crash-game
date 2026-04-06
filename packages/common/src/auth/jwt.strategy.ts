import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";

export interface JwtPayload {
  sub: string;
  preferred_username: string;
}

export interface AuthenticatedUser {
  playerId: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const realm = process.env.KEYCLOAK_REALM ?? "crash-game";
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${process.env.KEYCLOAK_URL}/realms/${realm}/protocol/openid-connect/certs`,
      }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return { playerId: payload.sub, username: payload.preferred_username };
  }
}
