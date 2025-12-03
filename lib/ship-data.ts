/**
 * Ship configuration and default data
 */

import { ShipDataInput, ShipName } from "./types";

export const SHIP_NAMES: readonly ShipName[] = ["ALL", "GAJABAHU", "SAGARA", "SAYURA", "SHAKTHI", "VIJAYABAHU"] as const;

// Default/latest oil change data for each ship
// TODO: Populate with actual data from OCMR documents
export const SHIP_DEFAULT_DATA: Record<string, ShipDataInput> = {
    GAJABAHU: {
        ship_name: "GAJABAHU",
        oil_hrs: 3500,
        total_hrs: 98000,
        viscosity_40: 140,
        viscosity_100: 14.5,
        viscosity_index: 95,
        oil_refill_start: 0,
        oil_topup: 0,
        health_score_lag_1: 0.1,
        fe_ppm: 5.0,
        pb_ppm: 2.0,
        cu_ppm: 4.0,
        al_ppm: 1.0,
        si_ppm: 2.0,
        cr_ppm: 0.5,
        sn_ppm: 0.5,
        ni_ppm: 0.5,
        tbn: 8.0,
        water_content: "<0.1",
        flash_point: 210,
    },
    SAGARA: {
        ship_name: "SAGARA",
        oil_hrs: 3200,
        total_hrs: 95000,
        viscosity_40: 135,
        viscosity_100: 14.0,
        viscosity_index: 93,
        oil_refill_start: 0,
        oil_topup: 0,
        health_score_lag_1: 0.12,
        fe_ppm: 6.0,
        pb_ppm: 2.5,
        cu_ppm: 5.0,
        al_ppm: 1.5,
        si_ppm: 2.5,
        cr_ppm: 0.5,
        sn_ppm: 0.5,
        ni_ppm: 0.5,
        tbn: 7.5,
        water_content: "<0.1",
        flash_point: 208,
    },
    SAYURA: {
        ship_name: "SAYURA",
        oil_hrs: 3800,
        total_hrs: 102000,
        viscosity_40: 142,
        viscosity_100: 15.0,
        viscosity_index: 96,
        oil_refill_start: 0,
        oil_topup: 0,
        health_score_lag_1: 0.09,
        fe_ppm: 4.5,
        pb_ppm: 1.8,
        cu_ppm: 3.5,
        al_ppm: 0.8,
        si_ppm: 1.8,
        cr_ppm: 0.5,
        sn_ppm: 0.5,
        ni_ppm: 0.5,
        tbn: 8.5,
        water_content: "<0.1",
        flash_point: 212,
    },
    SHAKTHI: {
        ship_name: "SHAKTHI",
        oil_hrs: 3600,
        total_hrs: 99000,
        viscosity_40: 138,
        viscosity_100: 14.3,
        viscosity_index: 94,
        oil_refill_start: 0,
        oil_topup: 0,
        health_score_lag_1: 0.11,
        fe_ppm: 5.5,
        pb_ppm: 2.2,
        cu_ppm: 4.5,
        al_ppm: 1.2,
        si_ppm: 2.2,
        cr_ppm: 0.5,
        sn_ppm: 0.5,
        ni_ppm: 0.5,
        tbn: 7.8,
        water_content: "<0.1",
        flash_point: 209,
    },
    VIJAYABAHU: {
        ship_name: "VIJAYABAHU",
        oil_hrs: 3400,
        total_hrs: 97000,
        viscosity_40: 137,
        viscosity_100: 14.2,
        viscosity_index: 94,
        oil_refill_start: 0,
        oil_topup: 0,
        health_score_lag_1: 0.10,
        fe_ppm: 5.2,
        pb_ppm: 2.1,
        cu_ppm: 4.2,
        al_ppm: 1.1,
        si_ppm: 2.1,
        cr_ppm: 0.5,
        sn_ppm: 0.5,
        ni_ppm: 0.5,
        tbn: 7.9,
        water_content: "<0.1",
        flash_point: 210,
    },
};

/**
 * Get default data for a ship
 */
export function getShipDefaultData(shipName: string): ShipDataInput | null {
    if (shipName === "ALL" || !shipName) {
        return null;
    }
    return SHIP_DEFAULT_DATA[shipName] || null;
}

/**
 * Get ship display name
 */
export function getShipDisplayName(shipName: string | null | undefined): string {
    if (!shipName || shipName === "ALL") {
        return "All Ships";
    }
    return shipName;
}
