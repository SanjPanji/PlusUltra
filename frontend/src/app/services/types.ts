export interface BackendContainer {
    id: number;
    latitude: number;
    longitude: number;
    fill_level: number;
    waste_type: 'general' | 'recyclable' | 'organic' | 'hazardous' | 'electronic';
    last_updated: string;
    is_active: boolean;
    needs_collection: boolean;
}

export interface BackendRoute {
    id: number;
    driver: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
    };
    stops: {
        stop_order: number;
        container: BackendContainer;
        visited_at: string | null;
    }[];
    total_distance: number;
    estimated_time: number;
    estimated_co2: number;
    polyline: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    is_active: boolean;
}

export function mapBackendContainer(bc: BackendContainer) {
    return {
        id: String(bc.id),
        name: `BIN-${String(bc.id).padStart(3, '0')}`,
        address: `Lat: ${bc.latitude.toFixed(4)}, Lng: ${bc.longitude.toFixed(4)}`, // Backend doesn't have addresses yet
        fillLevel: bc.fill_level,
        lat: bc.latitude,
        lng: bc.longitude,
        lastUpdated: bc.last_updated,
        wasteType: mapWasteType(bc.waste_type),
        district: 'Main District',
        estimatedArrival: 'TBD',
        capacity: 1000,
    };
}

export function mapWasteType(bt: string): any {
    const mapping: Record<string, string> = {
        'general': 'General',
        'recyclable': 'Recycling',
        'organic': 'Organic',
        'hazardous': 'Hazardous',
        'electronic': 'Recycling',
    };
    return mapping[bt] || 'General';
}
