import { Controller, Get, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { Contact, Prisma } from '@prisma/client';
import { ConsolidatedContactRequest } from 'src/dto/consolidatedContactRequest';
import { ConsolidatedContactResponse } from 'src/dto/consolidatedContactResponse';

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('new')
  async createContact(
    @Body() createIdentityDto: Prisma.ContactCreateInput,
  ): Promise<Contact> {
    return this.identityService.create(createIdentityDto);
  }

  @Get()
  async findAll(): Promise<Contact[]> {
    return this.identityService.findAll({});
  }

  @Post()
  async create(
    @Body() consolidatedContactRequest: ConsolidatedContactRequest,
  ): Promise<ConsolidatedContactResponse> {
    const { email, phoneNumber } = consolidatedContactRequest;
    if (!email && !phoneNumber)
      throw new HttpException('Provide email or phonenumber', HttpStatus.BAD_REQUEST);
    return this.identityService.consolidateContacts(email, phoneNumber);
  }
}
