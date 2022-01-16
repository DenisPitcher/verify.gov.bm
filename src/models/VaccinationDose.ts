export class VaccinationDose {
    Num: number;
    Manufacturer: string;
    LotNumber: string;
    Date: Date;

    constructor(num: number, manufacturer: string, lotNumber: string, date: Date){
        this.Num = num;
        this.Manufacturer = manufacturer;
        this.LotNumber = lotNumber;
        this.Date = date;
    }
}

export default VaccinationDose;