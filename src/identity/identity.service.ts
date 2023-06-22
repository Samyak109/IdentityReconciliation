import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Contact, LinkPrecedence, Prisma } from '@prisma/client';
import { ConsolidatedContactRequest } from 'src/dto/consolidatedContactRequest';
import { ConsolidatedContactResponse } from 'src/dto/consolidatedContactResponse';

@Injectable()
export class IdentityService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ContactCreateInput): Promise<Contact> {
    return this.prisma.contact.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ContactWhereInput;
    orderBy?: Prisma.ContactOrderByWithRelationInput;
    distinct?: string[];
  }): Promise<Contact[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.contact.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async consolidateContacts(
    email: string,
    phoneNumber: string,
  ): Promise<ConsolidatedContactResponse> {
    // Find contacts with either phonenumber or email matches
    const existingContacts = await this.findAll({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    // New customer, create a entry in db
    if (existingContacts.length == 0) {
      const contact = await this.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary',
        updatedAt: new Date(),
      });
      return {
        contact: {
          primaryContactId: contact.id,
          emails: contact.email ? [contact.email] : [],
          phoneNumbers: contact.phoneNumber ? [contact.phoneNumber] : [],
          secondaryContactIds: [],
        },
      };
    }

    const linkedContacts = await this.getAllLinkedContacts(existingContacts);

    // Combine contacts and sort by created time
    const allSortedContacts = [...existingContacts, ...linkedContacts].sort(
      (a, b) =>
        a.createdAt.getUTCMilliseconds() - b.createdAt.getUTCMilliseconds(),
    );

    const primaryContact = allSortedContacts[0]; // Oldest one is real primary
    const secondaryContacts = allSortedContacts.slice(1); // All others should be secondary, if not make them

    // Update newer primary records to secondary
    await this.checkAndUpdateRecordsToSecondary(
      secondaryContacts,
      primaryContact.id,
    );

    // If customer has new contact information link it with primary contact
    const { emails, phoneNumbers, secondaryContactIds } =
      await this.checkAndCreateLinkedContact(
        allSortedContacts,
        primaryContact.id,
        email,
        phoneNumber,
      );

    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContactIds,
      },
    };
  }

  //*************Private ******************************/

  private async getAllLinkedContacts(existingContacts: Contact[]) {
    // Get all linked ''primary'' and ''secondary'' contacts
    return await this.findAll({
      where: {
        AND: {
          OR: [
            {
              linkPrecedence: 'secondary',
              linkedId: {
                in: existingContacts
                  .filter((contact) => contact.linkPrecedence == 'primary')
                  .map((contact) => contact.id),
              },
            },
            {
              linkPrecedence: 'primary',
              id: {
                in: existingContacts
                  .filter((contact) => contact.linkPrecedence == 'secondary')
                  .map((contact) => contact.linkedId),
              },
            },
          ],
          id: {
            not: {
              in: existingContacts.map((contact) => contact.id),
            },
          },
        },
      },
    });
  }

  private async checkAndUpdateRecordsToSecondary(
    secondaryContacts: Contact[],
    primaryContactId: number,
  ) {
    // Check If some secondary contact is primary
    if (
      secondaryContacts.some((contact) => contact.linkPrecedence == 'primary')
    ) {
      // Update all new primary to secondary
      await this.prisma.contact.updateMany({
        where: {
          id: {
            in: secondaryContacts
              .filter((contact) => contact.linkPrecedence == 'primary')
              .map((contact) => contact.id),
          },
        },
        data: {
          linkPrecedence: 'secondary',
          linkedId: primaryContactId,
        },
      });
    }
  }

  private async checkAndCreateLinkedContact(
    allSortedContacts: Contact[],
    primaryContactId: number,
    email: string,
    phoneNumber: string,
  ) {
    const allUniqueMailIds = [
      ...new Set(allSortedContacts.map((contact: Contact) => contact.email)),
    ];
    const allUniquePhoneNumbers = [
      ...new Set(
        allSortedContacts.map((contact: Contact) => contact.phoneNumber),
      ),
    ];

    // Check if payload contains new information
    const isNewMailId = email && !allUniqueMailIds.includes(email);
    const isNewPhoneNumber =
      phoneNumber && !allUniquePhoneNumbers.includes(phoneNumber);
    let contact: Contact = null;
    if (isNewMailId || isNewPhoneNumber) {
      // Create a new secondary contact
      contact = await this.create({
        email,
        phoneNumber,
        linkPrecedence: 'secondary',
        linkedId: primaryContactId,
        updatedAt: new Date(),
      });
    }
    return {
      emails: isNewMailId ? [...allUniqueMailIds, email] : allUniqueMailIds,
      phoneNumbers: isNewPhoneNumber
        ? [...allUniquePhoneNumbers, phoneNumber]
        : allUniquePhoneNumbers,
      secondaryContactIds:
        contact != null
          ? [...allSortedContacts.slice(1).map((x) => x.id), contact.id]
          : [...allSortedContacts.slice(1).map((x) => x.id)],
    };
  }
}
