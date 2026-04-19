import {
  Injectable,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';

@Injectable()
export class AuthService {

  // REGISTER
  async register(registerDto: any) {

    // TODO:
    // Check email exists

    // TODO:
    // Hash password

    // TODO:
    // Save user into database

    return {
      message: 'User registered successfully',
      user: {
        fullName: registerDto.fullName,
        email: registerDto.email
      }
    };
  }


  // LOGIN
  async login(loginDto: any) {

    // TODO:
    // Find user by email

    // TODO:
    // Compare password

    // TODO:
    // Check status:
    // active / locked / banned

    const accessToken = 'fake-access-token';

    const refreshToken = 'fake-refresh-token';

    return {
      message: 'Login successful',

      accessToken,

      refreshToken,

      user: {
        email: loginDto.email
      }
    };
  }


  // REFRESH TOKEN
  async refreshToken(refreshDto: any) {

    // TODO:
    // Verify refresh token

    // TODO:
    // Check in database

    // TODO:
    // Generate new access token

    return {
      accessToken: 'new-access-token',

      refreshToken: 'new-refresh-token'
    };
  }


  // LOGOUT
  async logout(refreshDto: any) {

    // TODO:
    // Revoke refresh token

    return {
      message: 'Logged out successfully'
    };
  }


  // GET CURRENT USER
  async getCurrentUser(user: any) {

    return {
      id: user?.id || '1',

      email: user?.email || 'test@gmail.com',

      role: user?.role || 'user'
    };
  }

}
