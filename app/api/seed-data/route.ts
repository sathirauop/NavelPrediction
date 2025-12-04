import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const ship = searchParams.get("ship");
    const machineryType = searchParams.get("machineryType");
    const model = searchParams.get("model");

    if (!ship || !machineryType || !model) {
        return NextResponse.json(
            { error: "Missing required parameters: ship, machineryType, model" },
            { status: 400 }
        );
    }

    const fileName = `seed-data-${ship}-${machineryType}-${model}.json`;
    const filePath = path.join(process.cwd(), "lib", "seed-data", fileName);

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: `Seed data file not found: ${fileName}` },
                { status: 404 }
            );
        }

        // Read and parse the file
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(fileContent);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error loading seed data:", error);
        return NextResponse.json(
            { error: "Failed to load seed data" },
            { status: 500 }
        );
    }
}
