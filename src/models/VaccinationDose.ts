export class VaccinationDose {
    Manufacturer: string;
    LotNumber: string;
    Date: Date;

    constructor(manufacturer: string, lotNumber: string, date: Date){
        this.Manufacturer = manufacturer;
        this.LotNumber = lotNumber;
        this.Date = date;
    }
}

export default VaccinationDose;