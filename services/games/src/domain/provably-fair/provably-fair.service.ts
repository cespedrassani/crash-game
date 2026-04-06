import { createHash, createHmac } from "node:crypto";
import { CrashPoint } from "../value-objects/crash-point.vo";

export interface CrashPointDerivation {
  hmac: string;
  h: number;
  instantCrash: boolean;
  formula: string;
  crashPointX100: number;
}

const MAX_UINT32 = 2 ** 32;

export class ProvablyFairService {
  static hashSeed(seed: string): string {
    return createHash("sha256").update(seed).digest("hex");
  }

  static calculateCrashPoint(serverSeed: string, clientSeed: string): CrashPoint {
    return CrashPoint.of(ProvablyFairService.deriveDetails(serverSeed, clientSeed).crashPointX100);
  }

  static deriveDetails(serverSeed: string, clientSeed: string): CrashPointDerivation {
    const hmac = createHmac("sha256", serverSeed).update(clientSeed).digest("hex");
    const h = parseInt(hmac.slice(0, 8), 16);

    if (h % 33 === 0) {
      return {
        hmac,
        h,
        instantCrash: true,
        formula: "h % 33 === 0 → instant crash",
        crashPointX100: 100,
      };
    }

    const crashPointX100 = Math.max(100, Math.floor((100 * MAX_UINT32) / (MAX_UINT32 - h)));
    return {
      hmac,
      h,
      instantCrash: false,
      formula: `floor(100 * ${MAX_UINT32} / (${MAX_UINT32} - ${h}))`,
      crashPointX100,
    };
  }

  static verify(
    serverSeed: string,
    clientSeed: string,
    claimedCrashPointX100: number,
  ): boolean {
    const { crashPointX100 } = ProvablyFairService.deriveDetails(serverSeed, clientSeed);
    return crashPointX100 === claimedCrashPointX100;
  }
}
