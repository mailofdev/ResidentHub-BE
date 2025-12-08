import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    const token = this.jwtService.sign({
      id: admin.id,
      email: admin.email,
    });

    return { message: 'Login success', token };
  }
}
