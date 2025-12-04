const fs = require('fs');
const path = require('path');

const seedDataDir = path.join(__dirname, '../lib/seed-data');

// Helper function to generate realistic variations
function generateVariation(baseValue, variationPercent = 10) {
    if (baseValue === null || baseValue === 0.5) return baseValue;
    const variation = baseValue * (variationPercent / 100);
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    return parseFloat((baseValue + variation * randomFactor).toFixed(2));
}

// Helper function to generate date between two dates
function generateDate(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Helper function to interpolate between two data points
function interpolateDataPoint(point1, point2, ratio, id, createdAt) {
    const newPoint = { id };

    for (const key in point1) {
        if (key === 'id') continue;
        if (key === 'created_at') {
            newPoint[key] = createdAt;
            continue;
        }

        const val1 = point1[key];
        const val2 = point2[key];

        if (typeof val1 === 'number' && typeof val2 === 'number') {
            // Interpolate numeric values with some random variation
            const interpolated = val1 + (val2 - val1) * ratio;
            const variation = generateVariation(interpolated, 5) - interpolated;
            newPoint[key] = parseFloat((interpolated + variation).toFixed(2));
        } else if (typeof val1 === 'string') {
            // Keep string values from point1
            newPoint[key] = val1;
        } else if (val1 === null) {
            newPoint[key] = null;
        } else {
            newPoint[key] = val1;
        }
    }

    return newPoint;
}

// Function to generate variations of a single data point
function generateVariationsFromSingle(basePoint, targetCount) {
    const expanded = [];
    const baseDate = new Date(basePoint.created_at);

    // Generate points going backwards in time
    for (let i = targetCount - 1; i >= 0; i--) {
        const newPoint = { id: targetCount - i };

        // Calculate date (going back in time, ~30 days between samples)
        const daysBack = (targetCount - 1 - i) * 30;
        const newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() - daysBack);
        newPoint.created_at = newDate.toISOString().replace('T', ' ').substring(0, 19);

        // Calculate oil hours (decreasing as we go back)
        const oilHrsBase = basePoint.oil_hrs || 500;
        const oilHrsDecrement = oilHrsBase / targetCount;
        newPoint.oil_hrs = parseFloat((oilHrsBase - (targetCount - 1 - i) * oilHrsDecrement + (Math.random() - 0.5) * 50).toFixed(2));
        if (newPoint.oil_hrs < 0) newPoint.oil_hrs = parseFloat((Math.random() * 200 + 100).toFixed(2));

        // Calculate total hours (decreasing as we go back)
        const totalHrsBase = basePoint.total_hrs || 30000;
        const totalHrsDecrement = 500;
        newPoint.total_hrs = parseFloat((totalHrsBase - (targetCount - 1 - i) * totalHrsDecrement + (Math.random() - 0.5) * 100).toFixed(2));

        // Copy and vary other numeric fields
        for (const key in basePoint) {
            if (key === 'id' || key === 'created_at' || key === 'oil_hrs' || key === 'total_hrs') continue;

            const val = basePoint[key];
            if (typeof val === 'number' && val !== 0.5) {
                // Add progressive variation (less variation for earlier points)
                const progressFactor = (targetCount - 1 - i) / targetCount;
                newPoint[key] = generateVariation(val, 8 * (1 - progressFactor * 0.5));
            } else {
                newPoint[key] = val;
            }
        }
        expanded.push(newPoint);
    }

    return expanded;
}

// Function to expand data points
function expandDataPoints(data, targetCount) {
    if (data.length === 0) return data;

    // Handle single data point case
    if (data.length === 1) {
        return generateVariationsFromSingle(data[0], targetCount);
    }

    const expanded = [];
    const sortedData = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Calculate how many points to generate between each existing point
    const gaps = sortedData.length - 1;
    const pointsPerGap = Math.floor((targetCount - sortedData.length) / gaps);
    const remainder = (targetCount - sortedData.length) % gaps;

    let currentId = 1;

    for (let i = 0; i < sortedData.length; i++) {
        const currentPoint = { ...sortedData[i], id: currentId++ };
        expanded.push(currentPoint);

        // Generate intermediate points
        if (i < sortedData.length - 1) {
            const nextPoint = sortedData[i + 1];
            const numIntermediatePoints = pointsPerGap + (i < remainder ? 1 : 0);

            const startDate = new Date(currentPoint.created_at);
            const endDate = new Date(nextPoint.created_at);

            for (let j = 1; j <= numIntermediatePoints; j++) {
                const ratio = j / (numIntermediatePoints + 1);
                const intermediateDate = new Date(startDate.getTime() + ratio * (endDate.getTime() - startDate.getTime()));
                const formattedDate = intermediateDate.toISOString().replace('T', ' ').substring(0, 19);

                const newPoint = interpolateDataPoint(currentPoint, nextPoint, ratio, currentId++, formattedDate);
                expanded.push(newPoint);
            }
        }
    }

    return expanded;
}

// Process all seed data files
function processSeedDataFiles() {
    const files = fs.readdirSync(seedDataDir).filter(f => f.endsWith('.json'));

    console.log(`Found ${files.length} seed data files\n`);

    files.forEach(filename => {
        const filePath = path.join(seedDataDir, filename);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        if (data.length < 30) {
            // Generate random count between 30 and 50
            const targetCount = Math.floor(Math.random() * 21) + 30; // 30 to 50

            console.log(`📊 ${filename}: ${data.length} points → ${targetCount} points`);

            const expandedData = expandDataPoints(data, targetCount);

            // Write back to file
            fs.writeFileSync(filePath, JSON.stringify(expandedData, null, 4));
            console.log(`   ✅ Expanded successfully\n`);
        } else {
            console.log(`⏭️  ${filename}: ${data.length} points (skipping, already has enough data)\n`);
        }
    });

    console.log('✨ All seed data files processed!');
}

// Run the script
processSeedDataFiles();
