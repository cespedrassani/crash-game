import { createHash, createHmac } from "node:crypto";
import { CrashPoint } from "../value-objects/crash-point.vo";

export interface CrashPointDerivation {
  hmac: string;
  h: number;
  instantCrash: boolean;
  formula: string;
  crashPointX100: number;
}

export class ProvalyFairService {
  static hashSeed(seed: string): string {
    return createHash("sha256").update(seed).digest("hex");
  }

  static calculateCrashPoint(serverSeed: string, clientSeed: string): CrashPoint {
    return CrashPoint.of(ProvalyFairService.deriveDetails(serverSeed, clientSeed).crashPointX100);
  }

  static deriveDetails(serverSeed: string, clientSeed: string): CrashPointDerivation {
    const hmac = createHmac("sha256", serverSeed).update(clientSeed).digest("hex");
    const h = parseInt(hmac.slice(0, 8), 16);
    const e = 4294967296;

    if (h % 33 === 0) {
      return {
        hmac,
        h,
        instantCrash: true,
        formula: "h % 33 === 0 → instant crash",
        crashPointX100: 100,
      };
    }

    const crashPointX100 = Math.max(100, Math.floor((100 * e) / (e - h)));
    return {
      hmac,
      h,
      instantCrash: false,
      formula: `floor(100 * ${e} / (${e} - ${h}))`,
      crashPointX100,
    };
  }

  static verify(
    serverSeed: string,
    clientSeed: string,
    claimedCrashPointX100: number,
  ): boolean {
    const { crashPointX100 } = ProvalyFairService.deriveDetails(serverSeed, clientSeed);
    return crashPointX100 === claimedCrashPointX100;
  }
}
