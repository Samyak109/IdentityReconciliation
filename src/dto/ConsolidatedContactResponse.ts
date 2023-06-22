export class ConsolidatedContactResponse {
  contact: Contact;
}

class Contact {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}
