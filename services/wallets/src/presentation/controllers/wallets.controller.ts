import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtGuard } from "../../infrastructure/auth/jwt.guard";
import { AuthenticatedUser } from "../../infrastructure/auth/jwt.strategy";
import { CreateWalletHandler } from "../../application/commands/create-wallet/create-wallet.handler";
import { DepositWalletHandler } from "../../application/commands/deposit-wallet/deposit-wallet.handler";
import { GetMyWalletHandler } from "../../application/queries/get-my-wallet.handler";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import { DepositRequestDto } from "../dtos/deposit-request.dto";
import { Wallet } from "../../domain/wallet/wallet.entity";

@ApiTags("wallets")
@Controller()
export class WalletsController {
  constructor(
    private readonly createWalletHandler: CreateWalletHandler,
    private readonly depositWalletHandler: DepositWalletHandler,
    private readonly getMyWalletHandler: GetMyWalletHandler,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create wallet for authenticated player" })
  async createWallet(@Request() req: { user: AuthenticatedUser }): Promise<WalletResponseDto> {
    const wallet = await this.createWalletHandler.execute({
      playerId: req.user.playerId,
      username: req.user.username,
    });
    return this.toDto(wallet);
  }

  @Get("me")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get authenticated player wallet and balance" })
  async getMyWallet(@Request() req: { user: AuthenticatedUser }): Promise<WalletResponseDto> {
    const wallet = await this.getMyWalletHandler.execute({ playerId: req.user.playerId });
    return this.toDto(wallet);
  }

  @Post("me/deposit")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deposit funds into authenticated player wallet" })
  async deposit(
    @Request() req: { user: AuthenticatedUser },
    @Body() body: DepositRequestDto,
  ): Promise<WalletResponseDto> {
    const wallet = await this.depositWalletHandler.execute({
      playerId: req.user.playerId,
      amountCents: body.amountCents,
      idempotencyKey: `deposit:${randomUUID()}`,
    });
    return this.toDto(wallet);
  }

  private toDto(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      username: wallet.username,
      balanceCents: wallet.balanceCents.toString(),
      createdAt: wallet.createdAt.toISOString(),
    };
  }
}
