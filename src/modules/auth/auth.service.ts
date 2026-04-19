import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {

  async register(data: any) {

    // check email exists
    // hash password
    // save user

    return {
      message: 'User registered successfully'
    };

  }

}
