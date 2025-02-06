import { AccountService } from "../account/types";

export interface ServiceCard {
  service: string | AccountService;
  identifier: string;
  balance: Balance[];
  history: ReservationHistory[];
  cardNumber: string | Blob | null;
  theme: StoreTheme;
  lastRefresh: Date;
  type: CardType;
  basicInfo: BasicInfo;
  optionalInfo?: OptionalInfo;
}

export interface StoreTheme {
  id: string;
  name: string;
  colors: {
    text: string;
    background: string;
    accent: string;
  };
  background: any;
}

export interface BasicInfo {
  id: string;
  fullName: string;
}

export interface OptionalInfo {
  id?: string;
  expiryDate?: Date;
  schoolName?: string;
  additionalNotes?: string;
}

export enum CardType {
  HighSchoolID = "HighSchoolID",
  Transport = "Transport",
  Canteen = "Canteen",
  QRCodeOnly = "QRCodeOnly",
  Payment = "Payment",
  AccessControl = "AccessControl",
}

export interface Balance {
  amount: number;
  currency: string;
}

export interface ReservationHistory {
  date: Date;
  details: string;
}

