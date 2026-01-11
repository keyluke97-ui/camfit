import { AnalysisResult } from "./mockData";

export async function saveToAirtable(data: AnalysisResult, campingId: string) {
    // Mock API call to Airtable
    console.log("Saving to Airtable...", { campingId, ...data });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        success: true,
        message: "Analysis results saved to Base 'Camfit Growth Data'",
        recordId: "rec" + Math.random().toString(36).substr(2, 9),
    };
}
