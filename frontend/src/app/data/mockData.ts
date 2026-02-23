export interface Container {
  id: string;
  name: string;
  address: string;
  fillLevel: number;
  lat: number;
  lng: number;
  lastUpdated: string;
  wasteType: 'General' | 'Recycling' | 'Organic' | 'Hazardous';
  district: string;
  estimatedArrival: string;
  capacity: number;
}

export const containers: Container[] = [
  { id: 'C001', name: 'BIN-001', address: 'Alexanderplatz 1, Mitte', fillLevel: 92, lat: 52.5200, lng: 13.4132, lastUpdated: '2 min ago', wasteType: 'General', district: 'Mitte', estimatedArrival: '10:15 AM', capacity: 1000 },
  { id: 'C002', name: 'BIN-002', address: 'Karl-Marx-Allee 15, Friedrichshain', fillLevel: 45, lat: 52.5175, lng: 13.4340, lastUpdated: '8 min ago', wasteType: 'Recycling', district: 'Friedrichshain', estimatedArrival: '10:30 AM', capacity: 800 },
  { id: 'C003', name: 'BIN-003', address: 'Unter den Linden 5, Mitte', fillLevel: 73, lat: 52.5165, lng: 13.3930, lastUpdated: '3 min ago', wasteType: 'General', district: 'Mitte', estimatedArrival: '10:45 AM', capacity: 1000 },
  { id: 'C004', name: 'BIN-004', address: 'Kurfürstendamm 22, Charlottenburg', fillLevel: 28, lat: 52.5044, lng: 13.3295, lastUpdated: '15 min ago', wasteType: 'Recycling', district: 'Charlottenburg', estimatedArrival: '11:00 AM', capacity: 800 },
  { id: 'C005', name: 'BIN-005', address: 'Potsdamer Platz 8, Tiergarten', fillLevel: 87, lat: 52.5096, lng: 13.3760, lastUpdated: '1 min ago', wasteType: 'General', district: 'Tiergarten', estimatedArrival: '11:15 AM', capacity: 1200 },
  { id: 'C006', name: 'BIN-006', address: 'Hackescher Markt 3, Mitte', fillLevel: 61, lat: 52.5229, lng: 13.4023, lastUpdated: '6 min ago', wasteType: 'Organic', district: 'Mitte', estimatedArrival: '11:30 AM', capacity: 600 },
  { id: 'C007', name: 'BIN-007', address: 'Boxhagener Str. 47, Friedrichshain', fillLevel: 95, lat: 52.5122, lng: 13.4540, lastUpdated: '4 min ago', wasteType: 'General', district: 'Friedrichshain', estimatedArrival: '11:45 AM', capacity: 1000 },
  { id: 'C008', name: 'BIN-008', address: 'Prenzlauer Allee 12, Prenzlauer Berg', fillLevel: 38, lat: 52.5310, lng: 13.4260, lastUpdated: '12 min ago', wasteType: 'Recycling', district: 'Prenzlauer Berg', estimatedArrival: '12:00 PM', capacity: 800 },
  { id: 'C009', name: 'BIN-009', address: 'Oranienstraße 91, Kreuzberg', fillLevel: 79, lat: 52.4995, lng: 13.4205, lastUpdated: '7 min ago', wasteType: 'General', district: 'Kreuzberg', estimatedArrival: '12:15 PM', capacity: 1000 },
  { id: 'C010', name: 'BIN-010', address: 'Schönhauser Allee 36, Prenzlauer Berg', fillLevel: 55, lat: 52.5361, lng: 13.4140, lastUpdated: '10 min ago', wasteType: 'Organic', district: 'Prenzlauer Berg', estimatedArrival: '12:30 PM', capacity: 600 },
  { id: 'C011', name: 'BIN-011', address: 'Torstraße 66, Mitte', fillLevel: 42, lat: 52.5268, lng: 13.4012, lastUpdated: '18 min ago', wasteType: 'Recycling', district: 'Mitte', estimatedArrival: '12:45 PM', capacity: 800 },
  { id: 'C012', name: 'BIN-012', address: 'Bernauer Str. 1, Wedding', fillLevel: 83, lat: 52.5352, lng: 13.3830, lastUpdated: '5 min ago', wasteType: 'General', district: 'Wedding', estimatedArrival: '01:00 PM', capacity: 1000 },
  { id: 'C013', name: 'BIN-013', address: 'Eberswalder Str. 14, Prenzlauer Berg', fillLevel: 17, lat: 52.5400, lng: 13.4080, lastUpdated: '22 min ago', wasteType: 'Recycling', district: 'Prenzlauer Berg', estimatedArrival: '01:15 PM', capacity: 800 },
  { id: 'C014', name: 'BIN-014', address: 'Müllerstraße 55, Wedding', fillLevel: 68, lat: 52.5420, lng: 13.3610, lastUpdated: '9 min ago', wasteType: 'General', district: 'Wedding', estimatedArrival: '01:30 PM', capacity: 1000 },
  { id: 'C015', name: 'BIN-015', address: 'Frankfurter Allee 82, Friedrichshain', fillLevel: 91, lat: 52.5110, lng: 13.4620, lastUpdated: '2 min ago', wasteType: 'General', district: 'Friedrichshain', estimatedArrival: '01:45 PM', capacity: 1200 },
];

// Driver route: ordered list of containers to visit (prioritizing overfilled ones)
export const driverRoute: Container[] = [
  containers[0],  // C001 - 92%
  containers[6],  // C007 - 95%
  containers[14], // C015 - 91%
  containers[4],  // C005 - 87%
  containers[11], // C012 - 83%
  containers[8],  // C009 - 79%
  containers[2],  // C003 - 73%
  containers[5],  // C006 - 61%
];

export const weeklyData = [
  { day: 'Mon', collected: 142, efficiency: 76, co2: 18 },
  { day: 'Tue', collected: 168, efficiency: 82, co2: 21 },
  { day: 'Wed', collected: 155, efficiency: 79, co2: 19 },
  { day: 'Thu', collected: 189, efficiency: 88, co2: 24 },
  { day: 'Fri', collected: 176, efficiency: 85, co2: 22 },
  { day: 'Sat', collected: 132, efficiency: 71, co2: 16 },
  { day: 'Sun', collected: 98, efficiency: 65, co2: 12 },
];

export const districtData = [
  { district: 'Mitte', total: 52, overfilled: 12, recycling: 18 },
  { district: 'Friedrichshain', total: 38, overfilled: 9, recycling: 14 },
  { district: 'Prenzlauer', total: 45, overfilled: 7, recycling: 20 },
  { district: 'Kreuzberg', total: 33, overfilled: 6, recycling: 11 },
  { district: 'Tiergarten', total: 28, overfilled: 4, recycling: 8 },
  { district: 'Wedding', total: 31, overfilled: 8, recycling: 9 },
];

export const wasteTypeData = [
  { name: 'General', value: 45, color: '#64748B' },
  { name: 'Recycling', value: 30, color: '#3B82F6' },
  { name: 'Organic', value: 20, color: '#22C55E' },
  { name: 'Hazardous', value: 5, color: '#EF4444' },
];

export const kpiData = {
  totalContainers: 247,
  overfilled: 31,
  co2Saved: 124,
  activeRoutes: 8,
  collectionsToday: 89,
  efficiencyRate: 84,
};
