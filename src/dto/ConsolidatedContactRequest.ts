import { IsEmpty, IsString } from "class-validator";

export class ConsolidatedContactRequest {
    @IsString()
    email? : string;
    
    @IsString()
    phoneNumber? : string; 
}