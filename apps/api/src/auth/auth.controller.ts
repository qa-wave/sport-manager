import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { LoginInput, RegisterInput, type LoginDto, type RegisterDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';

const REFRESH_COOKIE = 'club_rt';
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

/**
 * Cookie-based refresh flow:
 *   - Access token returned in the response body; client stores in memory.
 *   - Refresh token set as an httpOnly cookie; never exposed to JS.
 *   - Mobile clients that can't use cookies can read the Set-Cookie header
 *     off the Register/Login response and stash it in SecureStore manually,
 *     then send it back via the `Cookie` header on /refresh.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: RegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const parsed = RegisterInput.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const tokens = await this.auth.register(parsed.data, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const parsed = LoginInput.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const tokens = await this.auth.login(parsed.data, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const rt = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    if (!rt) throw new BadRequestException('Missing refresh token');

    const tokens = await this.auth.refresh(rt, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const rt = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    await this.auth.logout(rt);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  private setRefreshCookie(res: FastifyReply, token: string) {
    res.setCookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: THIRTY_DAYS_SECONDS,
    });
  }
}
