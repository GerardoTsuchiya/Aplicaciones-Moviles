import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './entities/auth-response.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usuarioService.findByEmail(email);
    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const user = await this.validateUser(loginInput.email, loginInput.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    return this.signTokens(user.id, user.email);
  }

  async refresh(token: string): Promise<AuthResponse> {
    let payload: { sub: number; email: string; type: string };
    try {
      payload = this.jwtService.verify<{ sub: number; email: string; type: string }>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Token inválido');
    return this.signTokens(payload.sub, payload.email);
  }

  private signTokens(userId: number, email: string): AuthResponse {
    const base = { sub: userId, email };
    return {
      accessToken:  this.jwtService.sign({ ...base, type: 'access' },  { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign({ ...base, type: 'refresh' }, { expiresIn: '7d' }),
    };
  }
}
