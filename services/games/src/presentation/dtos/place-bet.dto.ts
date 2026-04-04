import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, Min, Max } from "class-validator";

export class PlaceBetDto {
  @ApiProperty({ description: "Bet amount in BRL (1.00 to 1000.00)", example: 10.0 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  amount!: number;
}
