import VaccinationDose from './VaccinationDose';

export class VaccinationCertificate {
    LastName?: string;
    FirstName?: string;
    DateOfBirth?: Date;
    Gender?: string;
    ReservationId?: number;
    Doses?: VaccinationDose[];
   
    // constructor(lastName: string, firstName: string, dateOfBirth: Date, gender: string, reservationId: number, doses: VaccinationDose[]) {
    //     this.LastName = lastName;
    //     this.FirstName = firstName;
    //     this.DateOfBirth = dateOfBirth;
    //     this.Gender = gender;
    //     this.ReservationId = reservationId;
    //     this.Doses = doses;
    // }
}
export default VaccinationCertificate;

