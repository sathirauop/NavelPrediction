// Ship, Machinery Type, and Model Configuration

export interface Ship {
    id: string;
    label: string;
}

export interface MachineryType {
    id: string;
    label: string;
}

export interface Model {
    id: string;
    label: string;
    serialNumber: string;
}

export const SHIPS: Ship[] = [
    { id: 'gajabahu', label: 'SLNS Gajabahu' },
    { id: 'sayura', label: 'SLNS Sayura' },
    { id: 'sagara', label: 'SLNS Sagara' }
];

export const MACHINERY_TYPES: MachineryType[] = [
    { id: 'main-engine', label: 'Main Engine' },
    { id: 'gearbox', label: 'Gearbox' },
    { id: 'diesel-alternator', label: 'Diesel Alternator' }
];

export const MODELS: Record<string, Model[]> = {
    'main-engine': [
        { id: 'port', label: 'Port', serialNumber: '67-KI-1010' },
        { id: 'starboard', label: 'Starboard', serialNumber: '67-KI-1011' }
    ],
    'gearbox': [
        { id: 'port', label: 'Port', serialNumber: '67-GB-2010' },
        { id: 'starboard', label: 'Starboard', serialNumber: '67-GB-2011' }
    ],
    'diesel-alternator': [
        { id: 'no1', label: 'N o 1', serialNumber: '6T-J1-1111' },
        { id: 'no2', label: 'N o 2', serialNumber: '6T-J1-1113' },
        { id: 'no3', label: 'NO 3', serialNumber: '6T-J1-1115' },
        { id: 'no4', label: 'N O 4', serialNumber: '6T-J1-1117' }
    ]
};

export interface MachinerySelection {
    ship: string;
    machineryType: string;
    model: string;
}

// Default selection
export const DEFAULT_SELECTION: MachinerySelection = {
    ship: 'gajabahu',
    machineryType: 'main-engine',
    model: 'port'
};
