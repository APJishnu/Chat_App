
// types.ts
export interface FormData {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    isPhoneVerified?: boolean;
    phoneVerifiedAt?: string;
  }
  
  export interface FieldError {
    field: string;
    message: string;
  }
  

