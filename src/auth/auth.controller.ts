import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.adminLogin(body.email, body.password);
  }
}
