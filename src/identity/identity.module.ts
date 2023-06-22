import { Module } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [IdentityController],
  providers: [IdentityService, PrismaService]
})
export class IdentityModule {}
