// Interface simulasi schema tabel Stalls
export interface Stall {
    id: number;
    name: string;
    location: string;
    rating: number;
}

// Mock Data simulasi isi tabel Stalls
const stallsData: Stall[] = [
    { id: 1, name: "Kwetiau Goreng", location: "Kantin Alif FKIP", rating: 4.8 },
    { id: 2, name: "Bakso Pasca", location: "Kantin Bakso Pasca", rating: 4.5 },
    { id: 3, name: "Paket Chikcen Steak Hot Plate", location: "Kantin FK", rating: 4.8 }
];

export class StallRepository {
    async findAll(): Promise<Stall[]> {
        return stallsData;
    }

    async findById(id: number): Promise<Stall | undefined> {
        return stallsData.find(stall => stall.id === id);
    }
}
