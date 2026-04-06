import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min, Max } from "class-validator";

export class DepositRequestDto {
  @ApiProperty({ description: "Amount to deposit in cents", example: 10000 })
  @IsInt()
  @Min(100, { message: "Minimum deposit is R$ 1,00" })
  @Max(100_000_00, { message: "Maximum deposit is R$ 100.000,00" })
  amountCents!: number;
}
