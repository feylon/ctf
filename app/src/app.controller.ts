import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('health')
  @SkipThrottle()
  @ApiOperation({ summary: 'Server va ma‘lumotlar bazasi holati' })
  async getHealth() {
    return await this.appService.getHealth();
  }
}
