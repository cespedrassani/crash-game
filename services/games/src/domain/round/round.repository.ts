import { Round } from "./round.entity";
import { RoundPhase } from "./round-phase.enum";

export interface RoundRepository {
  findById(id: string): Promise<Round | null>;
  findCurrent(): Promise<Round | null>;
  findByPhase(phase: RoundPhase): Promise<Round[]>;
  findHistory(page: number, limit: number): Promise<{ rounds: Round[]; total: number }>;
  save(round: Round): Promise<void>;
}
