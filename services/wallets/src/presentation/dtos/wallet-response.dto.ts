import { ApiProperty } from "@nestjs/swagger";

export class WalletResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  playerId!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ description: "Balance in cents (integer)" })
  balanceCents!: string;

  @ApiProperty()
  createdAt!: string;
}

