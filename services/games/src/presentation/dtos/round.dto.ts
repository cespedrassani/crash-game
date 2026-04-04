import { ApiProperty } from "@nestjs/swagger";

export class BetDto {
  @ApiProperty() id!: string;
  @ApiProperty() playerId!: string;
  @ApiProperty() username!: string;
  @ApiProperty({ description: "Bet amount in cents" }) amount!: number;
  @ApiProperty({ enum: ["pending", "won", "lost"] }) status!: string;
  @ApiProperty({ required: false }) cashoutMultiplier?: number;
  @ApiProperty({ required: false, description: "Payout in cents" }) payout?: number;
  @ApiProperty() roundId!: string;
}

export class RoundDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ["betting", "running", "crashed"] }) phase!: string;
  @ApiProperty() seedHash!: string;
  @ApiProperty({ nullable: true }) crashPoint!: number | null;
  @ApiProperty({ nullable: true }) serverSeed!: string | null;
  @ApiProperty({ nullable: true }) startedAt!: string | null;
  @ApiProperty({ nullable: true }) endedAt!: string | null;
  @ApiProperty({ type: [BetDto] }) bets!: BetDto[];
}

export class RoundHistoryItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() crashPoint!: number;
  @ApiProperty() endedAt!: string;
  @ApiProperty() seedHash!: string;
}

