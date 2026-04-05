import { Injectable } from "@nestjs/common";
import { Round } from "../../domain/round/round.entity";
import type { RoundRepository } from "../../domain/round/round.repository";

export interface GetRoundHistoryQuery {
  page: number;
  limit: number;
}

@Injectable()
export class GetRoundHistoryHandler {
  constructor(private readonly roundRepository: RoundRepository) {}

  async execute(query: GetRoundHistoryQuery): Promise<{ rounds: Round[]; total: number }> {
    return this.roundRepository.findHistory(query.page, query.limit);
  }
}
