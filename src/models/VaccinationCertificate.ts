import VaccinationDose from './VaccinationDose';

export class VaccinationCertificate {
    LastName?: string;
    FirstName?: string;
    DateOfBirth?: Date;
    Gender?: string;
    ReservationId?: number;
    Doses?: VaccinationDose[];
}
export default VaccinationCertificate;

